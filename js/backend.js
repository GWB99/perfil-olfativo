/* Camada de dados: Supabase (produção) ou localStorage (modo demo). Mesma interface nos dois. */
const CFG = window.APP_CONFIG;
const ORDER_STATUS = ["aguardando_pagamento", "pago", "enviado", "entregue", "cancelado"];

function errMsg(e) {
  const m = String(e?.message || e || "");
  if (/CONVITE_INVALIDO|Database error saving new user/i.test(m)) return "Código de convite inválido. Neste momento o site está em teste fechado.";
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(m)) return "Confirme o seu e-mail pelo link que enviamos e tente de novo.";
  if (/already registered|already exists/i.test(m)) return "Esse e-mail já tem cadastro. Use Entrar.";
  if (/Password should be at least/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/SEM_ESTOQUE:(.*)/.test(m)) return "Sem estoque suficiente de " + m.match(/SEM_ESTOQUE:(.*)/)[1].trim() + ".";
  if (/PRODUTO_INDISPONIVEL/.test(m)) return "Um dos produtos do carrinho não está mais disponível.";
  if (/CARRINHO_VAZIO/.test(m)) return "Seu carrinho está vazio.";
  if (/LOGIN_NECESSARIO/.test(m)) return "Entre na sua conta para fechar o pedido.";
  return m || "Algo deu errado. Tente de novo.";
}

/* ======================= MODO DEMO ======================= */
function demoBackend() {
  const D = CFG.DEMO, K = "po_demo_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || null } catch (e) { return null } };
  let st = load() || {};
  st.users ??= {}; st.favorites ??= {}; st.orders ??= []; st.session ??= null;
  st.settings ??= { private_beta: D.PRIVATE_BETA, invite_code: D.INVITE_CODE, admin_emails: D.ADMIN_EMAILS, free_shipping_over: D.FREE_SHIPPING_OVER, shipping_fee: D.SHIPPING_FEE };
  if (!st.products) st.products = (window.CATALOG || []).map(p => { const { id, name, house, price, stock, volume, ...data } = p; return { id, name, house, price, stock, volume, active: true, data } });
  const save = () => { try { localStorage.setItem(K, JSON.stringify(st)) } catch (e) {} };
  save();
  const listeners = new Set();
  const emit = () => listeners.forEach(f => f());
  const me = () => st.session && st.users[st.session] ? st.users[st.session] : null;
  const isAdmin = () => me()?.role === "admin";
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const strip = u => u && (({ password, ...r }) => r)(u);
  return {
    mode: "demo",
    errMsg,
    onAuth(f) { listeners.add(f) },
    async betaRequired() { return !!st.settings.private_beta },
    async session() { return strip(me()) },
    async signUp({ name, email, password, invite, city }) {
      email = String(email).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Digite um e-mail válido.");
      if (String(password).length < 6) throw new Error("Password should be at least 6");
      if (Object.values(st.users).some(u => u.email === email)) throw new Error("already registered");
      const admin = st.settings.admin_emails.map(x => x.toLowerCase()).includes(email);
      if (!admin && st.settings.private_beta && invite !== st.settings.invite_code) throw new Error("CONVITE_INVALIDO");
      const id = uid();
      st.users[id] = { id, name, email, password, role: admin ? "admin" : "user", city: city?.name || CFG.DEFAULT_CITY.name, lat: city?.lat ?? CFG.DEFAULT_CITY.lat, lon: city?.lon ?? CFG.DEFAULT_CITY.lon, quiz_answers: null, olfactive_profile: null, quiz_done_at: null, created_at: new Date().toISOString() };
      st.session = id; save(); emit(); return strip(st.users[id]);
    },
    async signIn({ email, password }) {
      email = String(email).trim().toLowerCase();
      const u = Object.values(st.users).find(u => u.email === email && u.password === password);
      if (!u) throw new Error("Invalid login credentials");
      st.session = u.id; save(); emit(); return strip(u);
    },
    async signOut() { st.session = null; save(); emit() },
    async resetPassword() { throw new Error("No modo demo não há envio de e-mail. Crie outra conta para testar.") },
    async updateProfile(patch) {
      const u = me(); if (!u) throw new Error("LOGIN_NECESSARIO");
      const allowed = ["name", "city", "lat", "lon", "quiz_answers", "olfactive_profile", "quiz_done_at"];
      for (const k of allowed) if (k in patch) u[k] = patch[k];
      save(); return strip(u);
    },
    async products() { return st.products.filter(p => p.active || isAdmin()).map(p => ({ ...p })) },
    async favorites() { return [...(st.favorites[st.session] || [])] },
    async toggleFavorite(pid) {
      const a = st.favorites[st.session] ||= [];
      const i = a.indexOf(pid); if (i >= 0) a.splice(i, 1); else a.push(pid);
      save(); return [...a];
    },
    async shippingRules() { return { free_shipping_over: st.settings.free_shipping_over, shipping_fee: st.settings.shipping_fee } },
    async placeOrder(items, address) {
      if (!me()) throw new Error("LOGIN_NECESSARIO");
      if (!items.length) throw new Error("CARRINHO_VAZIO");
      const lines = []; let sub = 0;
      for (const it of items) {
        const p = st.products.find(x => x.id === it.id && x.active);
        if (!p) throw new Error("PRODUTO_INDISPONIVEL:" + it.id);
        const q = Math.max(1, Math.min(10, it.qty | 0));
        if (p.stock < q) throw new Error("SEM_ESTOQUE:" + p.name);
      }
      for (const it of items) {
        const p = st.products.find(x => x.id === it.id), q = Math.max(1, Math.min(10, it.qty | 0));
        p.stock -= q; sub += p.price * q;
        lines.push({ id: p.id, name: p.name, house: p.house, price: p.price, qty: q, volume: p.volume });
      }
      sub = Math.round(sub * 100) / 100;
      const ship = sub >= st.settings.free_shipping_over ? 0 : st.settings.shipping_fee;
      const o = { id: uid(), user_id: st.session, status: "aguardando_pagamento", items: lines, subtotal: sub, shipping: ship, total: Math.round((sub + ship) * 100) / 100, shipping_address: address, payment_provider: "simulado", created_at: new Date().toISOString() };
      st.orders.unshift(o); save(); return o.id;
    },
    async startPayment() { return null },
    async myOrders() { return st.orders.filter(o => o.user_id === st.session) },
    /* ---- admin ---- */
    async adminUsers() { if (!isAdmin()) return []; return Object.values(st.users).map(strip) },
    async adminOrders() { if (!isAdmin()) return []; return st.orders.map(o => ({ ...o, customer: strip(st.users[o.user_id]) })) },
    async adminSetOrderStatus(id, status) {
      if (!isAdmin()) throw new Error("Só o admin pode fazer isso.");
      const o = st.orders.find(x => x.id === id); if (!o) return;
      if (status === "cancelado" && o.status !== "cancelado") o.items.forEach(it => { const p = st.products.find(x => x.id === it.id); if (p) p.stock += it.qty });
      o.status = status; save();
    },
    async adminUpdateProduct(id, patch) {
      if (!isAdmin()) throw new Error("Só o admin pode fazer isso.");
      const p = st.products.find(x => x.id === id); if (!p) return;
      for (const k of ["price", "stock", "active", "volume"]) if (k in patch) p[k] = patch[k];
      save();
    },
    async adminSettings() { return isAdmin() ? { ...st.settings } : null },
    async adminSaveSettings(s) { if (!isAdmin()) throw new Error("Só o admin pode fazer isso."); Object.assign(st.settings, s); save() },
    async demoReset() { localStorage.removeItem(K); location.reload() }
  };
}

/* ======================= SUPABASE ======================= */
async function supabaseBackend() {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  const sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  const ok = r => { if (r.error) throw r.error; return r.data };
  let cache = null;
  async function profile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { cache = null; return null }
    const p = ok(await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle());
    cache = p ? { ...p, email: p.email || session.user.email } : { id: session.user.id, email: session.user.email, role: "user" };
    return cache;
  }
  const listeners = new Set();
  sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") listeners.forEach(f => f()) });
  const flat = p => ({ ...p, price: Number(p.price), stock: Number(p.stock) });
  return {
    mode: "supabase",
    errMsg,
    onAuth(f) { listeners.add(f) },
    async betaRequired() { const r = await sb.rpc("beta_status"); return r.error ? true : !!r.data },
    session: profile,
    async signUp({ name, email, password, invite, city }) {
      const r = await sb.auth.signUp({ email, password, options: { data: { name, invite_code: invite || "" }, emailRedirectTo: location.origin + location.pathname } });
      if (r.error) throw r.error;
      if (!r.data.session) return { pendingConfirmation: true };
      if (city) await sb.from("profiles").update({ city: city.name, lat: city.lat, lon: city.lon }).eq("id", r.data.user.id);
      return profile();
    },
    async signIn({ email, password }) { ok(await sb.auth.signInWithPassword({ email, password })); return profile() },
    async signOut() { await sb.auth.signOut(); cache = null },
    async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })) },
    async updateProfile(patch) {
      const p = cache || await profile(); if (!p) throw new Error("LOGIN_NECESSARIO");
      ok(await sb.from("profiles").update(patch).eq("id", p.id)); return profile();
    },
    async products() { return ok(await sb.from("products").select("*").order("name")).map(flat) },
    async favorites() { return ok(await sb.from("favorites").select("product_id")).map(r => r.product_id) },
    async toggleFavorite(pid) {
      const p = cache || await profile(); const favs = await this.favorites();
      if (favs.includes(pid)) ok(await sb.from("favorites").delete().eq("user_id", p.id).eq("product_id", pid));
      else ok(await sb.from("favorites").insert({ user_id: p.id, product_id: pid }));
      return this.favorites();
    },
    async shippingRules() { const r = await sb.rpc("public_settings"); const d = r.data || {}; return { free_shipping_over: Number(d.free_shipping_over ?? 299), shipping_fee: Number(d.shipping_fee ?? 19.9) } },
    async placeOrder(items, address) { return ok(await sb.rpc("place_order", { p_items: items.map(i => ({ id: i.id, qty: i.qty })), p_shipping: address })) },
    async startPayment(orderId) {
      if (CFG.CHECKOUT_MODE !== "mercadopago") return null;
      const r = await sb.functions.invoke("mp-checkout", { body: { order_id: orderId, back_url: location.origin + location.pathname } });
      if (r.error) throw r.error; return r.data?.init_point || null;
    },
    async myOrders() { const p = cache || await profile(); return ok(await sb.from("orders").select("*").eq("user_id", p.id).order("created_at", { ascending: false })).map(o => ({ ...o, total: +o.total, subtotal: +o.subtotal, shipping: +o.shipping })) },
    async adminUsers() { return ok(await sb.from("profiles").select("*").order("created_at", { ascending: false })) },
    async adminOrders() {
      const os = ok(await sb.from("orders").select("*").order("created_at", { ascending: false }));
      const us = await this.adminUsers(); const by = Object.fromEntries(us.map(u => [u.id, u]));
      return os.map(o => ({ ...o, total: +o.total, subtotal: +o.subtotal, shipping: +o.shipping, customer: by[o.user_id] }));
    },
    async adminSetOrderStatus(id, status) { ok(await sb.from("orders").update({ status }).eq("id", id)) },
    async adminUpdateProduct(id, patch) { ok(await sb.from("products").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id)) },
    async adminSettings() { return ok(await sb.from("app_settings").select("*").eq("id", 1).maybeSingle()) },
    async adminSaveSettings(s) { ok(await sb.from("app_settings").update({ ...s, updated_at: new Date().toISOString() }).eq("id", 1)) }
  };
}

window.createBackend = async () => (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) ? supabaseBackend() : demoBackend();
window.ORDER_STATUS = ORDER_STATUS;
