(async function () {
"use strict";
const CFG = window.APP_CONFIG, Q = window.QUESTIONS || [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (x, d = 0) => { const n = Number(x); return Number.isFinite(n) ? n : d };
const pct = x => Math.max(0, Math.min(100, Math.round(num(x))));
const brl = v => "R$ " + num(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} } };
let toastT; function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3200) }
document.title = CFG.SITE_NAME; $("brand-name").textContent = CFG.SITE_NAME;

/* ---------------- acordes e desenho ---------------- */
const ACC = {"Cítrico":"#C9A400","Marinho":"#2B7FB8","Aromático":"#4F8C6E","Especiado fresco":"#6FA33F","Amadeirado":"#8A5A35","Verde":"#2F9A4A","Fresco":"#3BA7A3","Âmbar":"#B0662A","Lavanda":"#7E62B3","Especiado quente":"#B8452F","Frutado":"#D0567A","Aquático":"#2B9BC4","Salgado":"#6E8FA3","Floral branco":"#C7A6C9","Floral":"#C46FA0","Atalcado":"#A99BB5","Almiscarado":"#9A8C7E","Couro":"#6B4A36","Doce":"#D9739B","Balsâmico":"#8F5B3A","Baunilha":"#D6A85C","Canela":"#A4532C","Rosa":"#D4567E","Animálico":"#7A5C4A","Tropical":"#E08A2E","Oud":"#5A3B2E","Patchouli":"#6F5A3A","Metálico":"#8C99A3","Chocolate":"#5C3A2A","Especiado suave":"#B98A5A","Herbal":"#5E8A4A","Musgoso":"#4E6B45","Terroso":"#7D6A4F","Defumado":"#5F6468","Íris":"#8C7DB8","Violeta":"#7B4FA0","Aldeídico":"#9FB3C8"};
let gid = 0;
function bottle(liquid) {
  const id = "g" + (++gid);
  return `<svg viewBox="0 0 96 128" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${liquid}" stop-opacity=".95"/><stop offset=".55" stop-color="${liquid}" stop-opacity=".7"/><stop offset="1" stop-color="${liquid}" stop-opacity=".95"/></linearGradient></defs>
    <rect x="38" y="6" width="20" height="18" rx="3" fill="var(--fg)" opacity=".85"/><rect x="42" y="24" width="12" height="8" fill="var(--muted)"/>
    <rect x="14" y="32" width="68" height="90" rx="12" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/><rect x="18" y="48" width="60" height="70" rx="9" fill="url(#${id})"/>
    <rect x="24" y="40" width="6" height="70" rx="3" fill="#fff" opacity=".35"/></svg>`;
}
const liquid = r => /^#[0-9a-f]{6}$/i.test(r.liquid || "") ? r.liquid : "#B9C7CF";
const accArr = acc => (acc || []).filter(a => Array.isArray(a) && a.length >= 2).map(([n, p]) => [String(n), pct(p)]).slice(0, 8);
const accObj = acc => Object.fromEntries(accArr(acc));
const accRows = a => a.map(([n, v]) => `<div class="acc-row"><span>${esc(n)}</span><div class="bar"><i style="width:${v}%;background:${ACC[n] || 'var(--accent)'}"></i></div><span class="mono" style="text-align:right">${v}%</span></div>`).join("");
const mini = acc => `<div class="mini-acc">${accArr(acc).slice(0, 3).map(([n]) => `<span style="background:${ACC[n] || 'var(--accent)'}">${esc(n)}</span>`).join("")}</div>`;
const list = a => Array.isArray(a) && a.length ? a.map(esc).join(", ") : "—";
const fUrl = r => r.url && /^https:\/\/www\.fragrantica\.com\//.test(r.url) ? r.url : "https://www.fragrantica.com/search/?query=" + encodeURIComponent((r.house ? r.house + " " : "") + (r.name || ""));

/* ---------------- datas ---------------- */
const WD = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"], MO = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const dParse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d) };
const todayISO = () => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0") };
function dayLabel(iso) { const diff = Math.round((dParse(iso) - dParse(todayISO())) / 864e5); return diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : "" }
const dShort = iso => WD[dParse(iso).getDay()].slice(0, 3);
const dDM = iso => { const d = dParse(iso); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") };
const dLong = iso => { const d = dParse(iso); return WD[d.getDay()] + ", " + d.getDate() + " de " + MO[d.getMonth()] };
const dtBR = s => { try { return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) } catch (e) { return "" } };
function seasonOf(iso) { const m = dParse(iso).getMonth() + 1; return m === 12 || m <= 2 ? "verao" : m <= 5 ? "outono" : m <= 8 ? "inverno" : "primavera" }
const SEASON_PT = { verao: "verão", outono: "outono", inverno: "inverno", primavera: "primavera" };

/* ---------------- previsão do tempo (Open-Meteo, sem chave) ---------------- */
const WMO = c => c === 0 ? "Céu limpo" : c <= 2 ? "Parcialmente nublado" : c === 3 ? "Nublado" : c <= 48 ? "Neblina" : c <= 57 ? "Garoa" : c <= 67 ? "Chuva" : c <= 77 ? "Neve" : c <= 82 ? "Pancadas de chuva" : "Tempestade";
const FALLBACK_FC = (() => { const out = [], base = [[18,24,80],[17,22,90],[16,20,70],[15,21,30],[16,24,10],[18,26,20],[19,27,40]]; const t = dParse(todayISO());
  base.forEach(([mn, mx, r], i) => { const d = new Date(t); d.setDate(t.getDate() + i); out.push({ date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), min: mn, max: mx, rain: r, cond: "Exemplo" }) }); return out })();
let FC = FALLBACK_FC, FC_SRC = "exemplo";
async function loadForecast(lat, lon) {
  const key = `wx_${lat.toFixed(2)}_${lon.toFixed(2)}_${todayISO()}`, cached = store.get(key, null);
  if (cached) { FC = cached; FC_SRC = "open-meteo"; return }
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_mean&hourly=temperature_2m,precipitation_probability&timezone=auto&forecast_days=7`;
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(u, { signal: ctl.signal }); if (!r.ok) throw 0; const j = await r.json();
    const H = j.hourly, avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
    FC = j.daily.time.map((date, i) => {
      const per = {}; [["manha", 6, 12], ["tarde", 12, 18], ["noite", 18, 24]].forEach(([k, a, b]) => {
        const idx = H.time.map((t, n) => t.startsWith(date) && +t.slice(11, 13) >= a && +t.slice(11, 13) < b ? n : -1).filter(n => n >= 0);
        per[k] = { t: avg(idx.map(n => H.temperature_2m[n])), rain: Math.max(0, ...idx.map(n => H.precipitation_probability[n] ?? 0)) };
      });
      return { date, min: Math.round(j.daily.temperature_2m_min[i]), max: Math.round(j.daily.temperature_2m_max[i]), rain: j.daily.precipitation_probability_max[i], mm: j.daily.precipitation_sum[i], cond: WMO(j.daily.weather_code[i]), wind: Math.round(j.daily.wind_speed_10m_max[i]) + " km/h", humidity: j.daily.relative_humidity_2m_mean?.[i] != null ? Math.round(j.daily.relative_humidity_2m_mean[i]) + "%" : null, periods: per };
    });
    FC_SRC = "open-meteo"; store.set(key, FC);
  } catch (e) { FC = FALLBACK_FC; FC_SRC = "exemplo" }
}
async function geocode(q) {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.split(",")[0].trim())}&count=1&language=pt&country_code=BR`);
    const j = await r.json(), g = j.results?.[0]; if (!g) return null;
    return { name: g.name + (g.admin1 ? ", " + g.admin1 : ""), lat: g.latitude, lon: g.longitude };
  } catch (e) { return null }
}

/* ---------------- perfil olfativo ---------------- */
const GROUPS = { "Fresco": ["Cítrico","Fresco","Aquático","Marinho","Salgado","Aldeídico","Metálico"], "Aromático": ["Aromático","Lavanda","Herbal","Verde","Especiado fresco"], "Amadeirado": ["Amadeirado","Terroso","Musgoso","Defumado","Couro","Oud","Patchouli"], "Especiado": ["Especiado quente","Canela","Especiado suave"], "Oriental": ["Âmbar","Balsâmico","Animálico"], "Gourmand": ["Doce","Baunilha","Chocolate"], "Floral": ["Floral","Floral branco","Rosa","Íris","Violeta","Atalcado","Almiscarado"], "Frutado": ["Frutado","Tropical"] };
const GROUP_TXT = { "Fresco": "limpo e luminoso, do tipo que lembra banho tomado", "Aromático": "herbal e elegante, com lavanda e ervas", "Amadeirado": "seco e sofisticado, com madeiras e terra", "Especiado": "quente e envolvente, com especiarias", "Oriental": "ambarado e sensual, com resinas", "Gourmand": "doce e aconchegante, com baunilha e caramelo", "Floral": "macio e delicado, com flores e almíscar", "Frutado": "alegre e suculento, com frutas" };
const INT_PT = ["", "íntima", "moderada", "forte", "enorme"], LON_PT = ["", "curta", "moderada", "longa", "muito longa"];
function computeProfile(answers) {
  const vec = {}, occ = { academia: 0, trabalho: 0, social: 0, encontro: 0 }, se = { inverno: 0, primavera: 0, verao: 0, outono: 0 }, tm = { dia: 0, noite: 0 }; const ints = [], lons = [];
  Q.forEach(q => (answers[q.id] || []).forEach(i => { const o = q.options[i]; if (!o) return;
    for (const [k, v] of Object.entries(o.acc || {})) vec[k] = (vec[k] || 0) + v;
    for (const [k, v] of Object.entries(o.occ || {})) occ[k] = (occ[k] || 0) + v;
    for (const [k, v] of Object.entries(o.season || {})) se[k] = (se[k] || 0) + v;
    for (const [k, v] of Object.entries(o.time || {})) tm[k] = (tm[k] || 0) + v;
    if (o.intensity) ints.push(o.intensity); if (o.longevity) lons.push(o.longevity); }));
  const mx = Math.max(1, ...Object.values(vec));
  const accords = Object.entries(vec).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v / mx * 100)]);
  const norm = o => { const m = Math.max(1, ...Object.values(o)); return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v / m * 100)])) };
  const g = Object.entries(GROUPS).map(([n, ks]) => [n, ks.reduce((s, k) => s + Math.max(0, vec[k] || 0), 0)]).sort((a, b) => b[1] - a[1]);
  const family = g[0][1] ? (g[1][1] >= g[0][1] * .6 ? g[0][0] + " " + g[1][0] : g[0][0]) : "Equilibrado";
  const avoid = Object.entries(vec).filter(([, v]) => v < 0).map(([k]) => k);
  const intensity = ints.length ? ints.reduce((a, b) => a + b, 0) / ints.length : 2.5, longevity = lons.length ? lons.reduce((a, b) => a + b, 0) / lons.length : 2.5;
  const topOcc = Object.entries(occ).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 2).map(([k]) => OCC[k].label.toLowerCase());
  const summary = `Seu perfil é ${family.toLowerCase()}: ${GROUP_TXT[g[0][0]] || "versátil"}${g[1][1] >= g[0][1] * .6 ? `, com um lado ${GROUP_TXT[g[1][0]]}` : ""}. Você prefere projeção ${INT_PT[Math.round(intensity)]} e fixação ${LON_PT[Math.round(longevity)]}${topOcc.length ? `, pensando em ${topOcc.join(" e ")}` : ""}.${avoid.length ? ` Evitamos perfumes com muito ${avoid.slice(0, 2).join(" e ").toLowerCase()}.` : ""}`;
  return { v: 1, vec, accords, occ: norm(occ), seasons: norm(se), daytime: norm(tm), intensity, longevity, family, groups: g.slice(0, 6), avoid, summary };
}
function cosVec(a, b) { let d = 0, na = 0, nb = 0; for (const k in a) { na += a[k] * a[k]; if (b[k]) d += a[k] * b[k] } for (const k in b) nb += b[k] * b[k]; return na && nb ? d / Math.sqrt(na * nb) : 0 }
const PROJ = { "íntima": 1, "moderada": 2, "forte": 3, "enorme": 4 }, FIX = { "curta": 1, "moderada": 2, "longa": 3, "muito longa": 4 };
function profileMatch(p, prof) {
  if (!prof) return { total: 50, acc: 50, occ: 50, int: 50 };
  const pv = accObj(p.accords), uv = {}; const um = Math.max(1, ...Object.values(prof.vec).map(Math.abs));
  for (const [k, v] of Object.entries(prof.vec)) uv[k] = v / um * 100;
  const acc = pct(Math.max(0, cosVec(uv, pv)) * 125);
  const ow = prof.occ, ot = Object.values(ow).reduce((a, b) => a + b, 0) || 1;
  const occ = pct(Object.entries(ow).reduce((s, [k, w]) => s + w * num(p.occasions?.[k === "encontro" ? "social" : k], 50), 0) / ot);
  const pj = PROJ[p.performance?.projecao] ?? 2.5, fx = FIX[p.performance?.fixacao] ?? 2.5;
  const int = pct(100 - 28 * Math.abs(pj - prof.intensity) - 12 * Math.max(0, prof.longevity - fx));
  const st = Object.values(prof.seasons).reduce((a, b) => a + b, 0) || 1, se = pct(Object.entries(prof.seasons).reduce((s, [k, w]) => s + w * num(p.seasons?.[k], 50), 0) / st);
  const tt = (prof.daytime.dia + prof.daytime.noite) || 1, tm = pct((prof.daytime.dia * num(p.daytime?.dia, 50) + prof.daytime.noite * num(p.daytime?.noite, 50)) / tt);
  return { total: Math.round(.55 * acc + .17 * occ + .12 * int + .08 * se + .08 * tm), acc, occ, int, se, tm };
}

/* ---------------- clima × ocasião (mesmo cálculo do dash) ---------------- */
const OCC = {
  academia: { label: "Academia", sub: "lugar fechado · esportivo", occ: "academia", per: "manha", where: ["Nuca", "Peito"] },
  trabalho: { label: "Trabalho", sub: "escritório · formal", occ: "trabalho", per: "tarde", where: ["Pescoço", "Peito"] },
  social: { label: "Churrasco e passeio", sub: "ao ar livre · casual", occ: "social", per: "tarde", where: ["Pescoço", "Nuca"] },
  encontro: { label: "Encontro", sub: "elegante", occ: "social", per: "noite", where: ["Pescoço", "Peito"] }
};
const PER = { manha: { label: "Manhã", sub: "06h–12h", at: .25, tod: "dia" }, tarde: { label: "Tarde", sub: "12h–18h", at: .9, tod: "dia" }, noite: { label: "Noite", sub: "18h–00h", at: .4, tod: "noite" } };
const okNum = v => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const perT = (f, per) => okNum(f.periods?.[per]?.t) ? Math.round(Number(f.periods[per].t)) : Math.round(num(f.min) + PER[per].at * (num(f.max) - num(f.min)));
const perReal = (f, per) => okNum(f.periods?.[per]?.t);
const perRain = (f, per) => okNum(f.periods?.[per]?.rain) ? Number(f.periods[per].rain) : f.rain;
const HEAVY = {"Doce":1,"Baunilha":1,"Oud":1,"Especiado quente":.8,"Balsâmico":.9,"Canela":.9,"Chocolate":1,"Couro":.7,"Animálico":.8,"Âmbar":.5,"Tropical":.6,"Patchouli":.5};
function heaviness(acc) { const a = accArr(acc); const tot = a.reduce((s, [, v]) => s + v, 0) || 1; return a.reduce((s, [n, v]) => s + v * (HEAVY[n] || 0), 0) / tot }
let perManual = false, selPer = "tarde";
const perFor = o => perManual ? selPer : OCC[o].per;
function dayScore(p, f, o, per) {
  per = per || perFor(o);
  const O = OCC[o], P = PER[per], T = perT(f, per), lo = num(p.tempC?.min, 15), hi = num(p.tempC?.max, 27);
  const dist = T < lo ? lo - T : T > hi ? T - hi : 0, rn = perRain(f, per), hv = heaviness(p.accords), humid = rn != null && num(rn) >= 60;
  let c = 100 - dist * 9; if (T >= 21) c -= hv * (humid ? 40 : 25); c = pct(c);
  let oc = num(p.occasions?.[O.occ], 50); const pj = p.performance?.projecao;
  if (o === "academia") oc -= pj === "enorme" ? 30 : pj === "forte" ? 15 : 0;
  if (o === "trabalho") oc -= pj === "enorme" ? 25 : pj === "forte" ? 5 : 0;
  if (o === "encontro") oc = (oc + num(p.daytime?.[P.tod], 50)) / 2; oc = pct(oc);
  const tm = pct(p.daytime?.[P.tod]), se = pct(p.seasons?.[seasonOf(f.date)]);
  return { total: Math.round(.40 * c + .35 * oc + .15 * tm + .10 * se), c, oc, tm, se, T, lo, hi, dist, hv, humid, per };
}
function fullScore(p, f, o) { const m = profileMatch(p, me?.olfactive_profile), d = dayScore(p, f, o); return { ...d, match: m.total, day: d.total, total: Math.round(.45 * m.total + .55 * d.total) } }
const lvl = s => s >= 80 ? ["lvl-a", "Ótima"] : s >= 65 ? ["lvl-b", "Boa"] : s >= 50 ? ["lvl-c", "Ok"] : ["lvl-d", "Evite"];
function dose(p, sc, o) { let n = { "íntima": 4, "moderada": 3, "forte": 2, "enorme": 1 }[p.performance?.projecao] ?? 3; if (sc.T >= 26) n--; if (o === "academia") n--; n = Math.max(1, n); const opt = o === "trabalho" && ["curta", "moderada"].includes(p.performance?.fixacao) ? 1 : 0; return { n, opt } }
function reason(p, sc, o) {
  const parts = [], pl = PER[sc.per].label.toLowerCase();
  parts.push(sc.match >= 75 ? "Combina muito com o seu perfil olfativo." : sc.match >= 55 ? "Tem boa afinidade com o seu perfil." : "Foge um pouco do seu perfil, mas funciona no dia.");
  if (sc.dist === 0) parts.push(`À ${pl} devem fazer cerca de ${sc.T} °C, dentro da faixa em que ele rende (${sc.lo}–${sc.hi} °C).`);
  else parts.push(`Cerca de ${sc.T} °C à ${pl}, ${sc.T > sc.hi ? "mais quente" : "mais frio"} que a faixa ideal dele (${sc.lo}–${sc.hi} °C).`);
  if (sc.hv > .3 && sc.T >= 21) parts.push(sc.humid ? "É denso para um dia úmido e com chuva." : "É denso para o calor.");
  if (sc.oc >= 80) parts.push(`Combina com ${OCC[o].label.toLowerCase()}.`); else if (sc.oc < 50) parts.push(`Não é o estilo ideal para ${OCC[o].label.toLowerCase()}.`);
  return parts.join(" ");
}

/* ---------------- estado ---------------- */
const api = await window.createBackend();
let me = null, products = [], favs = [], tab = "hoje";
const cartKey = () => "cart_" + (me?.id || "anon");
let cart = [];
const saveCart = () => { store.set(cartKey(), cart); const n = cart.reduce((s, i) => s + i.qty, 0); $("cart-n").hidden = !n; $("cart-n").textContent = n };
const P = () => products.filter(p => p.active !== false).map(p => ({ ...p.data, ...p, data: undefined }));
const byId = id => { const p = products.find(x => x.id === id); return p ? { ...p.data, ...p, data: undefined } : null };

function showView(v) { for (const k of ["landing", "quiz", "app"]) $("v-" + k).hidden = k !== v; window.scrollTo({ top: 0 }) }

/* ======================= ENTRADA ======================= */
$("l-bottles").innerHTML = ["#2F6FD0", "#C8692B", "#4FB3A6", "#6E7F99", "#E6D3A3", "#5E6A72"].map(bottle).join("");
function authTab(up) { $("a-tab-up").setAttribute("aria-selected", up); $("a-tab-in").setAttribute("aria-selected", !up); $("f-up").hidden = !up; $("f-in").hidden = up; aSt("") }
$("a-tab-up").onclick = () => authTab(true); $("a-tab-in").onclick = () => authTab(false);
const aSt = (t, err) => { $("a-st").textContent = t; $("a-st").classList.toggle("err", !!err) };
$("f-up").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target, b = f.querySelector("button[type=submit]"); b.disabled = true; aSt("Criando a sua conta…");
  try {
    const cityQ = f.city.value.trim(); let city = null; if (cityQ) city = await geocode(cityQ);
    const r = await api.signUp({ name: f.name.value.trim(), email: f.email.value.trim(), password: f.password.value, invite: f.invite.value.trim(), city });
    if (r?.pendingConfirmation) { aSt("Conta criada. Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, volte e use Entrar."); authTab(false); return }
    aSt(""); await boot();
  } catch (err) { aSt(api.errMsg(err), true) } finally { b.disabled = false }
});
$("f-in").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target, b = f.querySelector("button[type=submit]"); b.disabled = true; aSt("Entrando…");
  try { await api.signIn({ email: f.email.value.trim(), password: f.password.value }); aSt(""); await boot() } catch (err) { aSt(api.errMsg(err), true) } finally { b.disabled = false }
});
$("b-forgot").onclick = async () => { const em = $("f-in").email.value.trim(); if (!em) { aSt("Digite o seu e-mail acima e toque de novo em Esqueci a senha.", true); return } try { await api.resetPassword(em); aSt("Enviamos um link para redefinir a senha.") } catch (err) { aSt(api.errMsg(err), true) } };

/* ======================= QUIZ ======================= */
let qi = 0, answers = {};
function renderQuiz() {
  const q = Q[qi], sel = answers[q.id] || [];
  $("q-count").textContent = `${qi + 1} de ${Q.length}`; $("q-bar").style.width = (qi / Q.length * 100) + "%";
  $("q-eyebrow").textContent = `Pergunta ${qi + 1}`; $("q-title").textContent = q.title; $("q-sub").textContent = q.sub || (q.multi ? `Pode marcar até ${q.max || q.options.length}.` : "Escolha uma opção.");
  $("q-opts").innerHTML = q.options.map((o, i) => `<button class="opt" type="button" data-i="${i}" aria-pressed="${sel.includes(i)}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</button>`).join("");
  $("q-back").style.visibility = qi ? "visible" : "hidden";
  $("q-next").disabled = !sel.length; $("q-next").textContent = qi === Q.length - 1 ? "Ver meu perfil" : "Próxima";
}
$("q-opts").addEventListener("click", e => {
  const b = e.target.closest("[data-i]"); if (!b) return; const q = Q[qi], i = +b.dataset.i; let sel = answers[q.id] || [];
  if (q.multi) { sel = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]; if (q.max && sel.length > q.max) sel = sel.slice(-q.max) } else sel = [i];
  answers[q.id] = sel; renderQuiz();
  if (!q.multi) setTimeout(() => { if (qi < Q.length - 1 && answers[q.id]?.[0] === i) { qi++; renderQuiz() } }, 220);
});
$("q-back").onclick = () => { if (qi) { qi--; renderQuiz() } };
$("q-next").onclick = async () => {
  if (qi < Q.length - 1) { qi++; renderQuiz(); return }
  const b = $("q-next"); b.disabled = true; b.textContent = "Traçando o seu perfil…";
  try { const prof = computeProfile(answers); me = await api.updateProfile({ quiz_answers: answers, olfactive_profile: prof, quiz_done_at: new Date().toISOString() }); go("perfil"); toast("Perfil olfativo pronto!") }
  catch (err) { toast(api.errMsg(err)); b.disabled = false; b.textContent = "Ver meu perfil" }
};
function startQuiz(keep) { qi = 0; answers = keep && me?.quiz_answers ? { ...me.quiz_answers } : {}; renderQuiz(); showView("quiz") }

/* ======================= APP: abas ======================= */
const TABS = ["hoje", "loja", "fav", "perfil", "carrinho", "admin"];
function go(t) {
  if (!TABS.includes(t) || (t === "admin" && me?.role !== "admin")) t = "hoje";
  tab = t; showView("app");
  document.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  TABS.forEach(k => $("p-" + k).hidden = k !== t);
  if (location.hash.slice(1) !== t) history.replaceState(null, "", "#" + t);
  ({ hoje: renderR, loja: renderShop, fav: renderFav, perfil: renderProfile, carrinho: renderCart, admin: renderAdmin })[t]();
}
document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => go(b.dataset.tab));
window.addEventListener("hashchange", () => { if (me?.quiz_done_at) go(location.hash.slice(1)) });

/* ---------------- Para você ---------------- */
let selDay = null, selOcc = store.get("occ", "trabalho"), feat = null;
if (!OCC[selOcc]) selOcc = "trabalho"; selPer = OCC[selOcc].per;
const dayF = () => FC.find(f => f.date === selDay) || FC[0];
function defaultDay() { const t = todayISO(), hr = new Date().getHours(), idx = FC.findIndex(f => f.date === t); if (idx >= 0) return hr < 17 || idx === FC.length - 1 ? FC[idx].date : FC[idx + 1].date; return (FC.find(f => f.date > t) || FC[0]).date }
const ranked = (f, o) => P().map(p => ({ p, sc: fullScore(p, f, o) })).sort((a, b) => b.sc.total - a.sc.total);
function brkRow(label, v, note) { return `<div class="brk-row"><div>${label}<small>${note}</small></div><div class="bar"><i style="width:${v}%;background:var(--accent)"></i></div><span class="mono" style="text-align:right">${v}</span></div>` }
function buyBtns(p, small) {
  const inCart = cart.some(i => i.id === p.id), fav = favs.includes(p.id), out = p.stock <= 0;
  return `<div class="acts">
    <button class="${small ? "sbtn" : "btn"}" type="button" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Esgotado" : inCart ? "✓ No carrinho · +1" : "Comprar · " + brl(p.price)}</button>
    <button class="sbtn ${fav ? "on" : ""}" type="button" data-favt="${esc(p.id)}">${fav ? "★ Favorito" : "☆ Favoritar"}</button></div>`;
}
function renderR() {
  if (!selDay || !FC.find(f => f.date === selDay)) selDay = defaultDay();
  const f = dayF(), o = selOcc, lab = dayLabel(f.date);
  $("r-eyebrow").textContent = `Perfume do dia · ${me?.city || CFG.DEFAULT_CITY.name}`;
  $("r-title").textContent = (lab ? lab + " · " : "") + dLong(f.date);
  $("r-wx").innerHTML = `<span class="chip"><b>${num(f.min)}°–${num(f.max)}°C</b></span><span class="chip rain">☂ <b>${f.rain == null ? "—" : num(f.rain) + "%"}</b>${f.mm != null ? " · " + esc(Math.round(f.mm * 10) / 10) + " mm" : ""}</span>${f.cond ? `<span class="chip">${esc(f.cond)}</span>` : ""}${f.humidity ? `<span class="chip">Umidade <b>${esc(f.humidity)}</b></span>` : ""}`;
  $("r-days").innerHTML = FC.map(d => `<button class="dbtn" type="button" data-day="${d.date}" aria-pressed="${d.date === selDay}"><span class="tag">${dayLabel(d.date) || "&nbsp;"}</span><span class="d">${dShort(d.date)}</span><span class="dt">${dDM(d.date)}</span><span class="tt">${num(d.min)}°–${num(d.max)}°</span><span class="rr">☂ ${d.rain == null ? "—" : num(d.rain) + "%"}</span></button>`).join("");
  $("r-occ").innerHTML = Object.entries(OCC).map(([k, x]) => `<button type="button" data-occ="${k}" aria-pressed="${k === o}">${x.label}<small>${x.sub}</small></button>`).join("");
  const cur = perFor(o);
  $("r-per").innerHTML = `<span class="eyebrow" style="align-self:center;margin-right:4px">Período</span>` + Object.entries(PER).map(([k, x]) => `<button type="button" data-per="${k}" aria-pressed="${k === cur}">${x.label}<small>${x.sub} · ${perReal(f, k) ? "" : "~"}${perT(f, k)} °C</small></button>`).join("");
  const rk = ranked(f, o);
  if (!rk.length) { $("r-feat").innerHTML = `<div class="empty">Nenhum perfume no catálogo ainda.</div>`; $("r-rank").innerHTML = ""; $("r-week").innerHTML = ""; return }
  if (!feat || !rk.find(x => x.p.id === feat)) feat = rk[0].p.id;
  const x = rk.find(r => r.p.id === feat), p = x.p, sc = x.sc, [lc, lt] = lvl(sc.total), ds = dose(p, sc, o);
  $("r-feat").innerHTML = `
    <div class="card-head"><h2>${rk[0].p.id === feat ? "Melhor escolha" : "Escolha sua"}</h2><span class="when">${esc(OCC[o].label)} · ${PER[sc.per].label} · ${dShort(f.date)} ${dDM(f.date)}</span></div>
    <div class="feat">${bottle(liquid(p))}<div style="min-width:0"><div class="pname">${esc(p.name)}</div><div class="house">${esc(p.house || "")}${p.concentration ? " · " + esc(p.concentration) : ""}</div>${p.family ? `<span class="family">${esc(p.family)}</span>` : ""}</div>
      <div class="score ${lc}" aria-label="Compatibilidade ${sc.total} de 100">${sc.total}<small>${lt}</small></div></div>
    <div class="brk"><span class="eyebrow">Por que essa nota</span>
      ${brkRow("Seu perfil", sc.match, "acordes, intensidade e ocasiões do quiz")}
      ${brkRow("Clima", sc.c, `${perReal(f, sc.per) ? "" : "~"}${sc.T} °C à ${PER[sc.per].label.toLowerCase()} · ideal ${sc.lo}–${sc.hi} °C`)}
      ${brkRow("Ocasião", sc.oc, OCC[o].sub)}
      ${brkRow("Estação", sc.se, SEASON_PT[seasonOf(f.date)])}</div>
    <p class="why">${esc(reason(p, sc, o))}</p>
    <div class="dose"><span class="eyebrow">Dose</span><span class="drops">${'<span class="drop"></span>'.repeat(ds.n)}${'<span class="drop opt"></span>'.repeat(ds.opt)}</span><span class="mono">${ds.n} borrifada${ds.n > 1 ? "s" : ""}${ds.opt ? " + 1 à tarde" : ""}</span></div>
    <div class="where">${OCC[o].where.map(w => `<span>${w}</span>`).join("")}</div>
    ${buyBtns(p)}
    <div class="links"><a href="#" data-open="${esc(p.id)}">Ver perfil completo</a> · <a href="${fUrl(p)}" target="_blank" rel="noopener">Fragrantica ↗</a></div>`;
  $("r-rank-sub").textContent = `${rk.length} perfumes · toque para comparar`;
  $("r-rank").innerHTML = rk.slice(0, 12).map((r, i) => `<button type="button" data-feat="${esc(r.p.id)}" aria-current="${r.p.id === feat}"><span class="pos">${i + 1}º</span><span style="min-width:0">${esc(r.p.name)}<small>${esc(r.p.house || "")} · ${brl(r.p.price)}</small></span><span class="bar"><i style="width:${r.sc.total}%;background:${r.sc.total >= 80 ? 'var(--ok)' : r.sc.total >= 65 ? 'var(--accent)' : r.sc.total >= 50 ? 'var(--muted)' : 'var(--warm)'}"></i></span><span class="mono" style="text-align:right">${r.sc.total}</span></button>`).join("");
  $("r-week").innerHTML = `<table><thead><tr><th></th>${FC.map(d => `<th>${dayLabel(d.date) || dShort(d.date)}<small>${dDM(d.date)} · ${num(d.min)}–${num(d.max)}°</small></th>`).join("")}</tr></thead><tbody>
    ${Object.keys(OCC).map(oo => `<tr><th>${OCC[oo].label}<small>${PER[perFor(oo)].label}</small></th>${FC.map(d => { const b = ranked(d, oo)[0]; const [c] = lvl(b.sc.total); return `<td><button class="cell ${c}" type="button" data-cell="${d.date}|${oo}" aria-current="${d.date === selDay && oo === o}"><b>${esc(b.p.name)}</b><span>${b.sc.total}</span></button></td>` }).join("")}</tr>`).join("")}</tbody></table>`;
  $("r-src").innerHTML = `<strong>Fontes:</strong> ${FC_SRC === "open-meteo" ? `previsão do <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> para ${esc(me?.city || CFG.DEFAULT_CITY.name)}` : "previsão de exemplo (não consegui carregar a previsão real agora)"}; acordes e notas do <a href="https://www.fragrantica.com" target="_blank" rel="noopener">Fragrantica</a>. Estação, ocasião, temperatura ideal e projeção são estimativas. Frascos ilustrativos.`;
}
$("r-days").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (!b) return; selDay = b.dataset.day; feat = null; renderR() });
$("r-occ").addEventListener("click", e => { const b = e.target.closest("[data-occ]"); if (!b) return; selOcc = b.dataset.occ; store.set("occ", selOcc); perManual = false; selPer = OCC[selOcc].per; feat = null; renderR() });
$("r-per").addEventListener("click", e => { const b = e.target.closest("[data-per]"); if (!b) return; selPer = b.dataset.per; perManual = true; feat = null; renderR() });
$("r-rank").addEventListener("click", e => { const b = e.target.closest("[data-feat]"); if (!b) return; feat = b.dataset.feat; renderR() });
$("r-week").addEventListener("click", e => { const b = e.target.closest("[data-cell]"); if (!b) return; [selDay, selOcc] = b.dataset.cell.split("|"); feat = null; renderR(); window.scrollTo({ top: 0, behavior: "smooth" }) });

/* ações comuns: comprar, favoritar, abrir perfil */
document.addEventListener("click", async e => {
  const add = e.target.closest("[data-add]"), fv = e.target.closest("[data-favt]"), op = e.target.closest("[data-open]");
  if (add) { addToCart(add.dataset.add); return }
  if (fv) { fv.disabled = true; try { favs = await api.toggleFavorite(fv.dataset.favt); toast(favs.includes(fv.dataset.favt) ? "Adicionado aos favoritos." : "Removido dos favoritos."); go(tab) } catch (err) { toast(api.errMsg(err)) } finally { fv.disabled = false } return }
  if (op) { e.preventDefault(); shopSel = op.dataset.open; go("loja"); setTimeout(() => $("s-det").scrollIntoView({ behavior: "smooth" }), 50) }
});
function addToCart(id) {
  const p = byId(id); if (!p) return; const it = cart.find(i => i.id === id);
  if (it) { if (it.qty >= Math.min(10, p.stock)) { toast("Quantidade máxima disponível já está no carrinho."); return } it.qty++ } else cart.push({ id, qty: 1 });
  saveCart(); toast(`${p.name} no carrinho.`); go(tab);
}

/* ---------------- Loja ---------------- */
let shopSel = null, shopFilt = "todos";
const SFILT = [["todos", "Todos"], ["top", "Mais compatíveis (80+)"], ["verao", "Verão"], ["inverno", "Inverno"], ["academia", "Academia"], ["trabalho", "Trabalho"], ["noite", "Noite"], ["ate200", "Até R$ 200"]];
function shopPasses(p, m) {
  switch (shopFilt) { case "top": return m >= 80; case "verao": return num(p.seasons?.verao) >= 70; case "inverno": return num(p.seasons?.inverno) >= 70; case "academia": return num(p.occasions?.academia) >= 60; case "trabalho": return num(p.occasions?.trabalho) >= 70; case "noite": return num(p.daytime?.noite) >= 80; case "ate200": return p.price <= 200 }
  return true;
}
function tileHTML(p, m) {
  return `<div class="tile shop-tile" role="button" tabindex="0" data-id="${esc(p.id)}" aria-current="${shopSel === p.id}">${bottle(liquid(p))}<div style="min-width:0"><div class="tn">${esc(p.name)}</div><div class="th">${esc(p.house || "")}${p.concentration ? " · " + esc(p.concentration) : ""}${p.volume ? " · " + esc(p.volume) : ""}</div>${mini(p.accords)}
    <span class="fit ${m >= 80 ? "ok" : m < 50 ? "hot" : ""}">${m}% compatível com você</span>
    <div class="buyrow"><span class="price-tag">${brl(p.price)}</span><span class="stock ${p.stock <= 3 ? "low" : ""}">${p.stock <= 0 ? "Esgotado" : p.stock <= 3 ? `Últimas ${p.stock}` : ""}</span></div>
    ${buyBtns(p, true)}</div></div>`;
}
function renderShop() {
  $("s-filt").innerHTML = SFILT.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${shopFilt === k}">${l}</button>`).join("");
  const q = $("s-q").value.trim().toLowerCase(), sort = $("s-sort").value;
  let rows = P().map(p => ({ p, m: profileMatch(p, me?.olfactive_profile).total }))
    .filter(({ p, m }) => shopPasses(p, m) && (!q || [p.name, p.house, p.family, ...(p.notes?.top || []), ...(p.notes?.mid || []), ...(p.notes?.base || [])].join(" ").toLowerCase().includes(q)));
  rows.sort(sort === "price-asc" ? (a, b) => a.p.price - b.p.price : sort === "price-desc" ? (a, b) => b.p.price - a.p.price : sort === "name" ? (a, b) => a.p.name.localeCompare(b.p.name) : (a, b) => b.m - a.m);
  $("s-count").textContent = `${rows.length} perfumes`;
  $("s-tiles").innerHTML = rows.length ? rows.map(({ p, m }) => tileHTML(p, m)).join("") : `<div class="empty">Nenhum perfume neste filtro.</div>`;
  const p = shopSel && byId(shopSel);
  $("s-det").innerHTML = p ? detailHTML(p) : "";
}
function detailHTML(p) {
  const m = profileMatch(p, me?.olfactive_profile), f = dayF(), s = p.seasons || {}, d = p.daytime || {}, t = p.tempC || {}, o = p.occasions || {};
  const tmin = num(t.min, 15), tmax = num(t.max, 25), X = v => (Math.max(0, Math.min(40, v)) / 40 * 100);
  const cols = [["Inverno", s.inverno, "#3E7CB8"], ["Primavera", s.primavera, "#4F9A5E"], ["Verão", s.verao, "#D59A1E"], ["Outono", s.outono, "#B5651D"], ["Dia", d.dia, "#C9A400"], ["Noite", d.noite, "#4C4F8C"]];
  return `<div class="detail-head"><span class="eyebrow">Detalhes</span><button class="btn ghost" type="button" data-close>Fechar</button></div>
  <div class="occ"><section class="card">
    <div class="card-head"><h2>Perfil</h2><span class="src ok">Acordes e notas do Fragrantica</span></div>
    <div class="hero">${bottle(liquid(p))}<div><div class="pname">${esc(p.name)}</div><div class="house">${esc(p.house || "")}${p.year ? " · " + esc(p.year) : ""}${p.concentration ? " · " + esc(p.concentration) : ""}</div>${p.family ? `<span class="family">${esc(p.family)}</span>` : ""}${p.inspiredBy ? `<div class="hint" style="margin-top:6px">Inspirado em ${esc(p.inspiredBy)}</div>` : ""}</div></div>
    <div class="acc"><span class="eyebrow">Acordes principais</span>${accRows(accArr(p.accords))}</div>
    <div class="notes"><div><span class="eyebrow">Topo</span>${list(p.notes?.top)}</div><div><span class="eyebrow">Coração</span>${list(p.notes?.mid)}</div><div><span class="eyebrow">Fundo</span>${list(p.notes?.base)}</div></div>
    <div class="occfit">${p.performance?.fixacao ? `<span>Fixação: <b>${esc(p.performance.fixacao)}</b></span>` : ""}${p.performance?.projecao ? `<span>Projeção: <b>${esc(p.performance.projecao)}</b></span>` : ""}</div>
    <div class="links"><a href="${fUrl(p)}" target="_blank" rel="noopener">Abrir no Fragrantica ↗</a></div></section>
  <section class="card"><div class="card-head"><h2>Com você</h2><span class="verdict ${m.total >= 75 ? "v-new" : m.total >= 55 ? "v-mid" : "v-red"}">${m.total}% compatível</span></div>
    <div class="brk">${brkRow("Acordes", m.acc, "parecido com o seu perfil olfativo")}${brkRow("Ocasiões", m.occ, "onde você mais usa")}${brkRow("Intensidade", m.int, "projeção e fixação que você pediu")}${brkRow("Estação", m.se, "épocas que você prefere")}${brkRow("Dia e noite", m.tm, "horário em que você usa")}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="price-tag">${brl(p.price)}<small>${esc(p.volume || "")}</small></span><span class="stock ${p.stock <= 3 ? "low" : ""}">${p.stock <= 0 ? "Esgotado" : `${p.stock} em estoque`}</span></div>
    ${buyBtns(p)}</section></div>
  <section class="fc"><div class="card-head"><h2>Quando usar</h2><span class="when">estimativa · 0–100</span></div>
    <div class="seasons">${cols.map(([n, v, c]) => `<div class="season"><div class="vbar"><i style="height:${pct(v)}%;background:${c}"></i></div><span>${n}</span><span class="mono">${pct(v)}</span></div>`).join("")}</div>
    <div><span class="eyebrow">Temperatura ideal: ${tmin}–${tmax} °C</span><div class="temp"><div class="axis"></div><div class="band" style="left:${X(tmin)}%;width:${Math.max(2, X(tmax) - X(tmin))}%"></div>${f ? `<div class="mk" style="left:${X(num(f.max))}%"></div>` : ""}${[0, 10, 20, 30, 40].map(v => `<span class="tick" style="left:${X(v)}%">${v}°</span>`).join("")}</div>
    ${f ? `<p class="status" style="margin:4px 0 0">Linha tracejada: máxima de ${esc(dLong(f.date))} (${num(f.max)} °C).</p>` : ""}</div>
    <div class="occfit">${[["Academia", o.academia], ["Trabalho", o.trabalho], ["Social", o.social]].map(([n, v]) => `<span>${n} <b>${pct(v)}%</b></span>`).join("")}</div></section>`;
}
$("s-filt").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; shopFilt = b.dataset.f; renderShop() });
$("s-q").addEventListener("input", renderShop); $("s-sort").addEventListener("change", renderShop);
function tileOpen(e, root) { if (e.target.closest("button,a")) return; const t = e.target.closest(".tile"); if (!t) return; shopSel = t.dataset.id; if (root !== "s-tiles") go("loja"); else renderShop(); setTimeout(() => $("s-det").scrollIntoView({ behavior: "smooth", block: "start" }), 30) }
["s-tiles", "f-tiles"].forEach(id => { $(id).addEventListener("click", e => tileOpen(e, id)); $(id).addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("tile")) tileOpen(e, id) }) });
$("s-det").addEventListener("click", e => { if (e.target.closest("[data-close]")) { shopSel = null; renderShop() } });

/* ---------------- Favoritos ---------------- */
function renderFav() {
  const ps = favs.map(byId).filter(Boolean);
  $("f-count").textContent = ps.length ? `${ps.length} perfume${ps.length > 1 ? "s" : ""}` : "";
  $("f-tiles").innerHTML = ps.length ? ps.map(p => tileHTML(p, profileMatch(p, me?.olfactive_profile).total)).join("") : `<div class="empty">Nenhum favorito ainda. Use ☆ Favoritar na loja ou nas recomendações.</div>`;
}

/* ---------------- Meu perfil ---------------- */
function radar(prof) {
  const g = (prof.groups || []).slice(0, 6); if (g.length < 3) return "";
  const mx = Math.max(1, ...g.map(x => x[1])), R = 110, C = 150, n = g.length, pt = (i, r) => [C + r * Math.sin(2 * Math.PI * i / n), C - r * Math.cos(2 * Math.PI * i / n)];
  const rings = [.25, .5, .75, 1].map(f => `<polygon points="${g.map((_, i) => pt(i, R * f).join(",")).join(" ")}" fill="none" stroke="var(--line)"/>`).join("");
  const shape = g.map(([, v], i) => pt(i, R * Math.max(.06, v / mx)).join(",")).join(" ");
  const labels = g.map(([k], i) => { const [x, y] = pt(i, R + 22); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="600" fill="var(--fg)" font-family="IBM Plex Sans, sans-serif">${esc(k)}</text>` }).join("");
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Radar do perfil olfativo">${rings}<polygon points="${shape}" fill="color-mix(in srgb,var(--accent) 30%,transparent)" stroke="var(--accent)" stroke-width="2"/>${labels}</svg>`;
}
async function renderProfile() {
  const prof = me?.olfactive_profile;
  $("u-eyebrow").innerHTML = `${esc(me?.name || "")} · ${esc(me?.email || "")} ${me?.role === "admin" ? '<span class="pill admin">admin</span>' : ""} ${api.mode === "demo" ? '<span class="pill demo">modo demo</span>' : ""}`;
  $("u-prof").innerHTML = !prof ? `<div class="empty">Você ainda não respondeu o quiz.</div>` : `
    <section class="card"><div class="profile-hero"><div style="display:grid;gap:12px">
      <span class="eyebrow">Sua família olfativa</span><div class="pname" style="font-size:clamp(28px,5vw,40px)">${esc(prof.family)}</div>
      <p class="why" style="font-size:15.5px">${esc(prof.summary)}</p>
      <div class="occfit"><span>Projeção <b>${INT_PT[Math.round(prof.intensity)]}</b></span><span>Fixação <b>${LON_PT[Math.round(prof.longevity)]}</b></span><span>${prof.daytime.dia >= prof.daytime.noite ? "Mais de <b>dia</b>" : "Mais de <b>noite</b>"}</span></div></div>
      <div class="radar">${radar(prof)}</div></div></section>
    <div class="occ"><section class="card"><div class="card-head"><h2>Acordes que você curte</h2></div><div class="acc">${accRows(prof.accords)}</div>${prof.avoid?.length ? `<p class="hint">Evitar: ${prof.avoid.map(esc).join(", ")}</p>` : ""}</section>
    <section class="card"><div class="card-head"><h2>Top 3 para você</h2><span class="when">pelo perfil, sem considerar o clima</span></div>
      <div class="sim">${P().map(p => ({ p, m: profileMatch(p, prof).total })).sort((a, b) => b.m - a.m).slice(0, 3).map(({ p, m }) => `<div class="sim-row"><div><a href="#" data-open="${esc(p.id)}">${esc(p.name)}</a> <small>${esc(p.house)} · ${brl(p.price)}</small></div><div class="bar"><i style="width:${m}%;background:var(--ok)"></i></div><span class="mono" style="text-align:right">${m}%</span></div>`).join("")}</div>
      <button class="btn" type="button" onclick="location.hash='hoje'">Ver recomendações do dia</button></section></div>`;
  const f = $("f-me"); f.name.value = me?.name || ""; f.city.value = me?.city || "";
  $("u-orders").innerHTML = `<div class="status">Carregando…</div>`;
  try { const os = await api.myOrders(); $("u-orders").innerHTML = os.length ? os.map(orderHTML).join("") : `<div class="empty">Nenhum pedido ainda.</div>` } catch (err) { $("u-orders").innerHTML = `<div class="status err">${esc(api.errMsg(err))}</div>` }
}
const ST_PT = { aguardando_pagamento: "Aguardando pagamento", pago: "Pago", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
function orderHTML(o) {
  return `<div class="order"><div class="row"><span class="mono">#${esc(String(o.id).slice(0, 8))} · ${esc(dtBR(o.created_at))}</span><span class="verdict st-${esc(o.status)}">${esc(ST_PT[o.status] || o.status)}</span></div>
    <div>${(o.items || []).map(i => `${i.qty}× ${esc(i.name)} <span class="house">${esc(i.house || "")}</span>`).join("<br>")}</div>
    <div class="row"><span class="house">Frete ${o.shipping ? brl(o.shipping) : "grátis"}</span><strong>${brl(o.total)}</strong></div></div>`;
}
$("b-redo").onclick = () => startQuiz(true);
$("b-out").onclick = async () => { await api.signOut(); me = null; cart = []; saveCart(); showView("landing"); authTab(false) };
$("f-me").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target; $("u-st").textContent = "Salvando…";
  try { const patch = { name: f.name.value.trim() }; const cq = f.city.value.trim();
    if (cq && cq !== me.city) { const c = await geocode(cq); if (c) Object.assign(patch, { city: c.name, lat: c.lat, lon: c.lon }); else { $("u-st").textContent = "Não achei essa cidade. Tente só o nome, ex.: Campinas."; return } }
    me = await api.updateProfile(patch); await loadForecast(num(me.lat, CFG.DEFAULT_CITY.lat), num(me.lon, CFG.DEFAULT_CITY.lon)); selDay = null; $("u-st").textContent = "Dados salvos."; renderProfile() }
  catch (err) { $("u-st").textContent = api.errMsg(err) }
});

/* ---------------- Carrinho ---------------- */
let ship = { free_shipping_over: 299, shipping_fee: 19.9 };
function renderCart() {
  cart = cart.filter(i => byId(i.id)); saveCart();
  if (!cart.length) { $("c-body").innerHTML = `<div class="empty">Seu carrinho está vazio. <a href="#loja">Ir para a loja</a></div>`; return }
  const lines = cart.map(i => ({ ...i, p: byId(i.id) })), sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0), fr = sub >= ship.free_shipping_over ? 0 : ship.shipping_fee;
  $("c-body").innerHTML = `<div class="cart"><section class="card"><div class="card-head"><h2>Itens</h2><span class="when">${lines.length} perfume${lines.length > 1 ? "s" : ""}</span></div>
    <div>${lines.map(l => `<div class="cline">${bottle(liquid(l.p))}<div style="min-width:0"><div class="an" style="font-family:var(--display);font-weight:700">${esc(l.p.name)}</div><div class="house">${esc(l.p.house)} · ${esc(l.p.volume || "")} · ${brl(l.p.price)}</div>
      <div class="row" style="margin-top:6px"><span class="qty"><button type="button" data-q="${esc(l.id)}|-1" aria-label="Menos">−</button><span>${l.qty}</span><button type="button" data-q="${esc(l.id)}|1" aria-label="Mais">+</button></span><button class="linkbtn" type="button" data-q="${esc(l.id)}|0">Remover</button></div></div>
      <strong class="mono">${brl(l.p.price * l.qty)}</strong></div>`).join("")}</div></section>
    <section class="card"><div class="card-head"><h2>Entrega e pagamento</h2></div>
      <form id="f-co" style="display:grid;gap:10px">
        <div class="grid2"><label class="f">CEP<input name="cep" required inputmode="numeric" placeholder="00000-000" maxlength="9"></label><label class="f">Número<input name="numero" required></label></div>
        <label class="f">Rua<input name="rua" required></label>
        <div class="grid2"><label class="f">Bairro<input name="bairro" required></label><label class="f">Cidade / UF<input name="cidade" required></label></div>
        <label class="f">Complemento<input name="comp"></label>
        <label class="f">Telefone<input name="tel" required inputmode="tel" placeholder="(11) 90000-0000"></label>
        <div class="sumrow"><span>Subtotal</span><span class="mono">${brl(sub)}</span></div>
        <div class="sumrow"><span>Frete</span><span class="mono">${fr ? brl(fr) : "grátis"}</span></div>
        ${fr ? `<p class="hint">Frete grátis acima de ${brl(ship.free_shipping_over)}.</p>` : ""}
        <div class="sumrow total"><span>Total</span><span>${brl(sub + fr)}</span></div>
        <button class="btn" type="submit">${CFG.CHECKOUT_MODE === "mercadopago" ? "Pagar com Mercado Pago" : "Fechar pedido"}</button>
        ${CFG.CHECKOUT_MODE !== "mercadopago" ? `<p class="hint"><strong>Modo teste:</strong> nenhum pagamento é cobrado. O pedido fica como “aguardando pagamento” e o admin pode marcá-lo como pago.</p>` : ""}
        <div class="status" id="co-st" role="status"></div></form></section></div>`;
  const f = $("f-co");
  f.cep.addEventListener("blur", async () => { const c = f.cep.value.replace(/\D/g, ""); if (c.length !== 8) return; try { const j = await (await fetch(`https://viacep.com.br/ws/${c}/json/`)).json(); if (!j.erro) { f.rua.value ||= j.logradouro || ""; f.bairro.value ||= j.bairro || ""; f.cidade.value ||= (j.localidade ? j.localidade + " / " + j.uf : "") } } catch (e) {} });
  f.addEventListener("submit", async e => {
    e.preventDefault(); const b = f.querySelector("button[type=submit]"); b.disabled = true; $("co-st").textContent = "Registrando o pedido…";
    const addr = Object.fromEntries(["cep", "rua", "numero", "bairro", "cidade", "comp", "tel"].map(k => [k, f[k].value.trim()]));
    try {
      const oid = await api.placeOrder(cart.map(i => ({ id: i.id, qty: i.qty })), addr);
      const pay = await api.startPayment(oid).catch(() => null);
      cart = []; saveCart(); products = await api.products();
      if (pay) { location.href = pay; return }
      toast("Pedido registrado!"); go("perfil");
    } catch (err) { $("co-st").textContent = api.errMsg(err); $("co-st").classList.add("err"); b.disabled = false; products = await api.products().catch(() => products) }
  });
}
$("c-body").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (!b) return; const [id, d] = b.dataset.q.split("|"), it = cart.find(i => i.id === id), p = byId(id); if (!it) return;
  if (d === "0") cart = cart.filter(i => i.id !== id); else { it.qty = Math.max(1, Math.min(10, p?.stock ?? 10, it.qty + +d)) } saveCart(); renderCart() });

/* ---------------- Admin ---------------- */
let adSub = "usuarios";
async function renderAdmin() {
  if (me?.role !== "admin") { go("hoje"); return }
  $("ad-body").innerHTML = `<div class="status">Carregando…</div>`;
  let users = [], orders = [], settings = null;
  try { [users, orders, settings] = await Promise.all([api.adminUsers(), api.adminOrders(), api.adminSettings()]); products = await api.products() } catch (err) { $("ad-body").innerHTML = `<div class="status err">${esc(api.errMsg(err))}</div>`; return }
  const paid = orders.filter(o => ["pago", "enviado", "entregue"].includes(o.status));
  $("ad-kpis").innerHTML = [["Cadastros", users.length], ["Quiz completo", users.filter(u => u.quiz_done_at).length], ["Pedidos", orders.length], ["Aguardando pgto.", orders.filter(o => o.status === "aguardando_pagamento").length], ["Faturado", brl(paid.reduce((s, o) => s + num(o.total), 0))]].map(([l, v]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("");
  $("ad-sub").innerHTML = [["usuarios", "Usuários"], ["pedidos", "Pedidos"], ["produtos", "Produtos e estoque"], ["config", "Configurações"]].map(([k, l]) => `<button type="button" data-s="${k}" aria-pressed="${adSub === k}">${l}</button>`).join("");
  const B = $("ad-body");
  if (adSub === "usuarios") B.innerHTML = `<div class="tbl"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Cidade</th><th>Perfil olfativo</th><th>Cadastro</th></tr></thead><tbody>${users.map(u => `<tr><td>${esc(u.name || "—")} ${u.role === "admin" ? '<span class="pill admin">admin</span>' : ""}</td><td>${esc(u.email)}</td><td>${esc(u.city || "")}</td><td>${u.olfactive_profile ? `<strong>${esc(u.olfactive_profile.family)}</strong>${mini(u.olfactive_profile.accords)}` : '<span class="house">quiz pendente</span>'}</td><td class="mono">${esc(dtBR(u.created_at))}</td></tr>`).join("") || `<tr><td colspan="5">Nenhum cadastro.</td></tr>`}</tbody></table></div>`;
  if (adSub === "pedidos") B.innerHTML = orders.length ? `<div class="tbl"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Entrega</th><th>Status</th></tr></thead><tbody>${orders.map(o => `<tr><td class="mono">#${esc(String(o.id).slice(0, 8))}<br><span class="house">${esc(dtBR(o.created_at))}</span></td><td>${esc(o.customer?.name || "—")}<br><span class="house">${esc(o.customer?.email || "")}</span></td><td>${(o.items || []).map(i => `${i.qty}× ${esc(i.name)}`).join("<br>")}</td><td class="mono">${brl(o.total)}</td><td style="font-size:12.5px">${o.shipping_address ? esc(`${o.shipping_address.rua}, ${o.shipping_address.numero} · ${o.shipping_address.bairro} · ${o.shipping_address.cidade} · CEP ${o.shipping_address.cep} · ${o.shipping_address.tel}`) : ""}</td><td><select data-ost="${esc(o.id)}">${window.ORDER_STATUS.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${ST_PT[s]}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhum pedido ainda.</div>`;
  if (adSub === "produtos") B.innerHTML = `<p class="hint">Os preços e estoques vieram com <strong>valores de teste</strong>. Ajuste aqui antes de abrir o site.</p><div class="tbl"><table><thead><tr><th>Perfume</th><th>Preço (R$)</th><th>Estoque</th><th>Volume</th><th>Ativo</th><th></th></tr></thead><tbody>${products.map(p => `<tr data-prow="${esc(p.id)}"><td><strong>${esc(p.name)}</strong><br><span class="house">${esc(p.house || "")}</span></td><td><input name="price" inputmode="decimal" value="${num(p.price).toFixed(2).replace(".", ",")}"></td><td><input name="stock" type="number" min="0" value="${num(p.stock)}" style="max-width:80px"></td><td><input name="volume" value="${esc(p.volume || "")}" style="max-width:90px"></td><td><input name="active" type="checkbox" ${p.active !== false ? "checked" : ""} style="width:18px;height:18px"></td><td><button class="sbtn" type="button" data-psave="${esc(p.id)}">Salvar</button></td></tr>`).join("")}</tbody></table></div>`;
  if (adSub === "config") B.innerHTML = settings ? `<section class="card"><form id="f-cfg" style="display:grid;gap:14px">
      <label class="switch"><input type="checkbox" name="private_beta" ${settings.private_beta ? "checked" : ""}> Teste fechado: só entra quem tiver o código de convite</label>
      <div class="grid2"><label class="f">Código de convite<input name="invite_code" value="${esc(settings.invite_code)}"></label><label class="f">Frete grátis acima de (R$)<input name="free_shipping_over" inputmode="decimal" value="${num(settings.free_shipping_over)}"></label><label class="f">Valor do frete (R$)<input name="shipping_fee" inputmode="decimal" value="${num(settings.shipping_fee)}"></label></div>
      <p class="hint">E-mails com acesso de admin: ${(settings.admin_emails || []).map(esc).join(", ")}. ${api.mode === "supabase" ? "Para mudar, edite a tabela app_settings no Supabase." : ""}</p>
      <div class="row"><button class="btn" type="submit">Salvar configurações</button>${api.mode === "demo" ? `<button class="danger" type="button" id="b-reset">Apagar todos os dados do modo demo</button>` : ""}</div>
      <div class="status" id="cfg-st"></div></form></section>` : `<div class="status err">Sem acesso às configurações.</div>`;
}
$("ad-sub").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b) return; adSub = b.dataset.s; renderAdmin() });
const parseBR = s => Number(String(s).replace(/[^\d,\.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
$("ad-body").addEventListener("change", async e => { const s = e.target.closest("[data-ost]"); if (!s) return; try { await api.adminSetOrderStatus(s.dataset.ost, s.value); toast("Status atualizado."); renderAdmin() } catch (err) { toast(api.errMsg(err)) } });
$("ad-body").addEventListener("click", async e => {
  const sv = e.target.closest("[data-psave]");
  if (sv) { const tr = sv.closest("tr"), price = parseBR(tr.querySelector("[name=price]").value), stock = parseInt(tr.querySelector("[name=stock]").value, 10);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) { toast("Preço ou estoque inválido."); return }
    try { await api.adminUpdateProduct(sv.dataset.psave, { price, stock, volume: tr.querySelector("[name=volume]").value.trim(), active: tr.querySelector("[name=active]").checked }); products = await api.products(); toast("Produto salvo.") } catch (err) { toast(api.errMsg(err)) } }
  if (e.target.id === "b-reset") { if (e.target.dataset.sure) api.demoReset(); else { e.target.dataset.sure = 1; e.target.textContent = "Confirmar: apagar tudo"; e.target.classList.add("sure") } }
});
$("ad-body").addEventListener("submit", async e => {
  if (e.target.id !== "f-cfg") return; e.preventDefault(); const f = e.target;
  try { await api.adminSaveSettings({ private_beta: f.private_beta.checked, invite_code: f.invite_code.value.trim(), free_shipping_over: parseBR(f.free_shipping_over.value), shipping_fee: parseBR(f.shipping_fee.value) }); ship = await api.shippingRules(); $("cfg-st").textContent = "Configurações salvas." } catch (err) { $("cfg-st").textContent = api.errMsg(err) }
});

/* ======================= BOOT ======================= */
async function boot() {
  me = await api.session().catch(() => null);
  if (!me) {
    const beta = await api.betaRequired().catch(() => true);
    $("invite-wrap").hidden = !beta;
    $("a-mode").innerHTML = api.mode === "demo" ? `<span class="pill demo">modo demo</span> Os dados ficam salvos só neste navegador.` : "";
    showView("landing"); return;
  }
  $("tab-admin").hidden = me.role !== "admin";
  [products, favs, ship] = await Promise.all([api.products(), api.favorites().catch(() => []), api.shippingRules().catch(() => ship)]);
  cart = store.get(cartKey(), []); saveCart();
  await loadForecast(num(me.lat, CFG.DEFAULT_CITY.lat), num(me.lon, CFG.DEFAULT_CITY.lon));
  if (!me.quiz_done_at) { startQuiz(false); return }
  go(location.hash.slice(1) || "hoje");
}

await boot();
})();
