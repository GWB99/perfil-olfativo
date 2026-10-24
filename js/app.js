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
async function geocode(q, country) {
  try {
    const br = !country || /^bra[sz]il$/i.test(country);
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(q).split(/[,/]/)[0].trim())}&count=5&language=pt${br ? "&country_code=BR" : ""}`);
    const j = await r.json(); let g = (j.results || [])[0];
    if (!br && country) g = (j.results || []).find(x => (x.country || "").toLowerCase().includes(country.toLowerCase().slice(0, 4))) || g;
    if (!g) return null;
    return { name: g.name + (g.admin1 ? ", " + g.admin1 : "") + (br ? "" : " · " + (g.country || country)), lat: g.latitude, lon: g.longitude };
  } catch (e) { return null }
}

/* ---------------- base de referência ---------------- */
const REF = window.REFERENCE || [];
const refById = id => REF.find(r => r.id === id) || null;
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function searchPerfumes(q, extra = []) {
  q = norm(q).trim(); if (!q) return [];
  const all = [...extra, ...REF].filter((p, i, a) => a.findIndex(x => x.id === p.id) === i);
  return all.map(p => { const n = norm(p.name + " " + (p.house || "")); return { p, s: n.startsWith(q) ? 0 : norm(p.name).includes(q) ? 1 : n.includes(q) ? 2 : 9 } }).filter(x => x.s < 9).sort((a, b) => a.s - b.s).slice(0, 6).map(x => x.p);
}

/* ---------------- perfil olfativo ---------------- */
const GROUPS = { "Fresco": ["Cítrico","Fresco","Aquático","Marinho","Salgado","Aldeídico","Metálico"], "Aromático": ["Aromático","Lavanda","Herbal","Verde","Especiado fresco"], "Amadeirado": ["Amadeirado","Terroso","Musgoso","Defumado","Couro","Oud","Patchouli"], "Especiado": ["Especiado quente","Canela","Especiado suave"], "Oriental": ["Âmbar","Balsâmico","Animálico"], "Gourmand": ["Doce","Baunilha","Chocolate"], "Floral": ["Floral","Floral branco","Rosa","Íris","Violeta","Atalcado","Almiscarado"], "Frutado": ["Frutado","Tropical"] };
const GROUP_TXT = { "Fresco": "limpo e luminoso, do tipo que lembra banho tomado", "Aromático": "herbal e elegante, com lavanda e ervas", "Amadeirado": "seco e sofisticado, com madeiras e terra", "Especiado": "quente e envolvente, com especiarias", "Oriental": "ambarado e sensual, com resinas", "Gourmand": "doce e aconchegante, com baunilha e caramelo", "Floral": "macio e delicado, com flores e almíscar", "Frutado": "alegre e suculento, com frutas" };
const INT_PT = ["", "íntima", "moderada", "forte", "enorme"], LON_PT = ["", "curta", "moderada", "longa", "muito longa"];
const PROJ = { "íntima": 1, "moderada": 2, "forte": 3, "enorme": 4 }, FIX = { "curta": 1, "moderada": 2, "longa": 3, "muito longa": 4 };
function computeProfile(answers) {
  const vec = {}, occ = { academia: 0, trabalho: 0, social: 0, encontro: 0 }, se = { inverno: 0, primavera: 0, verao: 0, outono: 0 }, tm = { dia: 0, noite: 0 }; const ints = [], lons = [];
  let fav = null, favW = 0;
  Q.forEach(q => {
    if (q.type === "perfume") { const id = answers[q.id]?.[0]; if (id && id !== "none") { fav = refById(id); favW = q.weight ?? .4 } return }
    (answers[q.id] || []).forEach(i => { const o = q.options[i]; if (!o) return;
      for (const [k, v] of Object.entries(o.acc || {})) vec[k] = (vec[k] || 0) + v;
      for (const [k, v] of Object.entries(o.occ || {})) occ[k] = (occ[k] || 0) + v;
      for (const [k, v] of Object.entries(o.season || {})) se[k] = (se[k] || 0) + v;
      for (const [k, v] of Object.entries(o.time || {})) tm[k] = (tm[k] || 0) + v;
      if (o.intensity) ints.push(o.intensity); if (o.longevity) lons.push(o.longevity); });
  });
  const nz = o => { const m = Math.max(1, ...Object.values(o).map(Math.abs)); return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / m * 100])) };
  let V = nz(vec), OC = nz(occ), SE = nz(se), TM = nz(tm);
  let intensity = ints.length ? ints.reduce((a, b) => a + b, 0) / ints.length : 2.5, longevity = lons.length ? lons.reduce((a, b) => a + b, 0) / lons.length : 2.5;
  if (fav) {   // o perfume favorito entra com o peso da pergunta (40%)
    const blend = (a, b) => { const out = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = (1 - favW) * (a[k] || 0) + favW * (b[k] || 0); return out };
    V = blend(V, accObj(fav.accords));
    OC = blend(OC, { academia: num(fav.occasions?.academia), trabalho: num(fav.occasions?.trabalho), social: num(fav.occasions?.social), encontro: (num(fav.occasions?.social) + num(fav.daytime?.noite)) / 2 });
    SE = blend(SE, fav.seasons || {}); TM = blend(TM, fav.daytime || {});
    intensity = (1 - favW) * intensity + favW * (PROJ[fav.performance?.projecao] ?? intensity);
    longevity = (1 - favW) * longevity + favW * (FIX[fav.performance?.fixacao] ?? longevity);
  }
  const r100 = o => { const m = Math.max(1, ...Object.values(o)); return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(Math.max(0, v) / m * 100)])) };
  const mx = Math.max(1, ...Object.values(V));
  const accords = Object.entries(V).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v / mx * 100)]);
  const g = Object.entries(GROUPS).map(([n, ks]) => [n, ks.reduce((s, k) => s + Math.max(0, V[k] || 0), 0)]).sort((a, b) => b[1] - a[1]);
  const two = g[1][1] >= g[0][1] * .6, family = g[0][1] ? (two ? g[0][0] + " " + g[1][0] : g[0][0]) : "Equilibrado";
  const avoid = Object.entries(V).filter(([, v]) => v < -10).map(([k]) => k);
  const ocN = r100(OC), topOcc = Object.entries(ocN).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 2).map(([k]) => OCC[k].label.toLowerCase());
  const summary = `Seu perfil é ${family.toLowerCase()}: ${GROUP_TXT[g[0][0]] || "versátil"}${two ? `, com um lado ${GROUP_TXT[g[1][0]]}` : ""}. Você combina com projeção ${INT_PT[Math.round(intensity)]} e fixação ${LON_PT[Math.round(longevity)]}${topOcc.length ? `, pensando em ${topOcc.join(" e ")}` : ""}.${fav ? ` ${Math.round(favW * 100)}% do perfil vem do ${fav.name}, o perfume que você já gosta.` : ""}${avoid.length ? ` Evitamos perfumes com muito ${avoid.slice(0, 2).join(" e ").toLowerCase()}.` : ""}`;
  return { v: 2, vec: V, accords, occ: ocN, seasons: r100(SE), daytime: r100(TM), intensity, longevity, family, groups: g.slice(0, 6), avoid, summary, base: fav ? { id: fav.id, name: fav.name, house: fav.house, weight: favW } : null };
}
function cosVec(a, b) { let d = 0, na = 0, nb = 0; for (const k in a) { na += a[k] * a[k]; if (b[k]) d += a[k] * b[k] } for (const k in b) nb += b[k] * b[k]; return na && nb ? d / Math.sqrt(na * nb) : 0 }
function profileMatch(p, prof) {
  if (!prof || !p.accords) return { total: 50, acc: 50, occ: 50, int: 50, se: 50, tm: 50 };
  const pv = accObj(p.accords), uv = prof.vec;
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
let me = null, products = [], favs = [], orders = [], tab = "hoje";
const cartKey = () => "cart_" + (me?.id || "anon");
let cart = [];
const saveCart = () => { store.set(cartKey(), cart); const n = cart.reduce((s, i) => s + i.qty, 0); $("cart-n").hidden = !n; $("cart-n").textContent = n };
const flatP = p => ({ ...p.data, ...p, data: undefined, forSale: true });
const P = () => products.filter(p => p.active !== false).map(flatP);
const byId = id => { const p = products.find(x => x.id === id && x.active !== false); return p ? flatP(p) : null };
const infoById = id => byId(id) || refById(id);
/* sem perfumes à venda, as recomendações usam a base de referência (sem botão de compra) */
const pool = () => { const s = P(); return s.length ? s : REF.map(r => ({ ...r, forSale: false })) };
const storeEmpty = () => !P().length;
const uidLocal = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

/* endereços */
const addrs = () => Array.isArray(me?.addresses) ? me.addresses : [];
const activeAddr = () => addrs().find(a => a.id === me?.active_address) || addrs()[0] || { label: "Padrão", cidade: CFG.DEFAULT_CITY.name, lat: CFG.DEFAULT_CITY.lat, lon: CFG.DEFAULT_CITY.lon, pais: "Brasil", partial: true };
const isBR = a => !a.pais || /^bra[sz]il$/i.test(a.pais);
const addrComplete = a => a && !a.partial && a.rua && a.numero && a.cidade && (isBR(a) ? a.cep : true);
const addrLine = a => a.partial ? esc(a.cidade || "") : esc([`${a.rua || ""}, ${a.numero || ""}${a.comp ? " · " + a.comp : ""}`, a.bairro, `${a.cidade || ""}${a.uf ? " / " + a.uf : ""}`, isBR(a) ? (a.cep ? "CEP " + a.cep : "") : a.pais].filter(Boolean).join(" · "));
const placeName = a => (a.geo || a.cidade || "").split(" · ")[0];
async function useAddrWeather() { const a = activeAddr(); await loadForecast(num(a.lat, CFG.DEFAULT_CITY.lat), num(a.lon, CFG.DEFAULT_CITY.lon)); selDay = null }

/* armário: o que a pessoa marcou + o que comprou aqui */
function wardrobe() {
  const own = (Array.isArray(me?.wardrobe) ? me.wardrobe : []).map(w => ({ ...w, info: infoById(w.id) }));
  const bought = [];
  orders.filter(o => o.status !== "cancelado").forEach(o => (o.items || []).forEach(i => { if (!own.some(w => w.id === i.id) && !bought.some(b => b.id === i.id)) bought.push({ id: i.id, name: i.name, house: i.house, source: "compra", status: o.status, info: infoById(i.id) }) }));
  return [...own, ...bought];
}

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
function perfumeCard(p, extra = "") { return `<div class="pcard">${bottle(liquid(p))}<div style="min-width:0"><div class="tn">${esc(p.name)}</div><div class="th">${esc(p.house || "")}${p.concentration ? " · " + esc(p.concentration) : ""}</div>${mini(p.accords)}</div>${extra}</div>` }
function renderQuiz() {
  const q = Q[qi], sel = answers[q.id] || [];
  $("q-count").textContent = `${qi + 1} de ${Q.length}`; $("q-bar").style.width = (qi / Q.length * 100) + "%";
  $("q-eyebrow").textContent = `Pergunta ${qi + 1}`; $("q-title").textContent = q.title;
  $("q-sub").textContent = q.sub || (q.multi ? `Pode marcar até ${q.max || q.options.length}.` : "Escolha uma opção.");
  if (q.type === "perfume") {
    const cur = sel[0] && sel[0] !== "none" ? refById(sel[0]) : null;
    $("q-opts").innerHTML = `<div style="grid-column:1/-1;display:grid;gap:10px">
      <input id="q-search" type="search" placeholder="Ex.: Zaad, Sauvage, Kaiak" autocomplete="off" aria-label="Buscar perfume">
      <div id="q-results" class="results"></div>
      ${cur ? `<div><span class="eyebrow">Escolhido</span>${perfumeCard(cur, '<span class="pill admin">40% do perfil</span>')}</div>` : ""}
      <button class="opt" type="button" data-none aria-pressed="${sel[0] === "none"}">Não tenho um favorito<small>O perfil sai só das suas respostas</small></button></div>`;
    const inp = $("q-search");
    inp.addEventListener("input", () => { const r = searchPerfumes(inp.value); $("q-results").innerHTML = inp.value.trim() ? (r.length ? r.map(p => `<button class="resbtn" type="button" data-pick="${esc(p.id)}">${esc(p.name)} <small>${esc(p.house || "")}</small></button>`).join("") : `<p class="hint">Não encontramos esse perfume na nossa base ainda. Escolha outro parecido ou “Não tenho um favorito”.</p>`) : "" });
    if (!cur) setTimeout(() => inp.focus(), 50);
  } else {
    $("q-opts").innerHTML = q.options.map((o, i) => `<button class="opt" type="button" data-i="${i}" aria-pressed="${sel.includes(i)}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</button>`).join("");
  }
  $("q-back").style.visibility = qi ? "visible" : "hidden";
  $("q-next").disabled = !sel.length; $("q-next").textContent = qi === Q.length - 1 ? "Ver meu perfil" : "Próxima";
}
$("q-opts").addEventListener("click", e => {
  const q = Q[qi];
  const pk = e.target.closest("[data-pick]"); if (pk) { answers[q.id] = [pk.dataset.pick]; renderQuiz(); return }
  if (e.target.closest("[data-none]")) { answers[q.id] = ["none"]; renderQuiz(); return }
  const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i; let sel = answers[q.id] || [];
  if (q.multi) { sel = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]; if (q.max && sel.length > q.max) sel = sel.slice(-q.max) } else sel = [i];
  answers[q.id] = sel; renderQuiz();
  if (!q.multi) setTimeout(() => { if (qi < Q.length - 1 && answers[q.id]?.[0] === i && Q[qi] === q) { qi++; renderQuiz() } }, 220);
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
const ranked = (f, o, list = pool()) => list.filter(p => p.accords).map(p => ({ p, sc: fullScore(p, f, o) })).sort((a, b) => b.sc.total - a.sc.total);
function brkRow(label, v, note) { return `<div class="brk-row"><div>${label}<small>${note}</small></div><div class="bar"><i style="width:${v}%;background:var(--accent)"></i></div><span class="mono" style="text-align:right">${v}</span></div>` }
function buyBtns(p, small) {
  if (!p.forSale) return `<div class="acts"><span class="pill">Ainda não está à venda</span>${wardBtn(p)}</div>`;
  const inCart = cart.some(i => i.id === p.id), fav = favs.includes(p.id), out = p.stock <= 0;
  return `<div class="acts">
    <button class="${small ? "sbtn" : "btn"}" type="button" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Esgotado" : inCart ? "✓ No carrinho · +1" : "Comprar · " + brl(p.price)}</button>
    <button class="sbtn ${fav ? "on" : ""}" type="button" data-favt="${esc(p.id)}">${fav ? "★ Favorito" : "☆ Favoritar"}</button>${wardBtn(p)}</div>`;
}
function wardBtn(p) { const has = (me?.wardrobe || []).some(w => w.id === p.id); return `<button class="sbtn ${has ? "on" : ""}" type="button" data-wt="${esc(p.id)}">${has ? "✓ No armário" : "＋ Tenho esse"}</button>` }
function poolNote() { return storeEmpty() ? `<p class="hint" style="margin:0">A loja ainda está vazia. Por enquanto as recomendações usam a nossa base de perfumes, que ainda não está à venda.</p>` : "" }
function wxChips(f) { return `<span class="chip"><b>${num(f.min)}°–${num(f.max)}°C</b></span><span class="chip rain">☂ <b>${f.rain == null ? "—" : num(f.rain) + "%"}</b>${f.mm != null ? " · " + esc(Math.round(f.mm * 10) / 10) + " mm" : ""}</span>${f.cond ? `<span class="chip">${esc(f.cond)}</span>` : ""}${f.humidity ? `<span class="chip">Umidade <b>${esc(f.humidity)}</b></span>` : ""}` }
function renderR() {
  if (!selDay || !FC.find(f => f.date === selDay)) selDay = defaultDay();
  const f = dayF(), o = selOcc, lab = dayLabel(f.date), A = activeAddr();
  $("r-eyebrow").textContent = `Perfume do dia · ${A.label} · ${placeName(A)}`;
  $("r-title").textContent = (lab ? lab + " · " : "") + dLong(f.date);
  $("r-wx").innerHTML = wxChips(f);
  $("r-days").innerHTML = FC.map(d => `<button class="dbtn" type="button" data-day="${d.date}" aria-pressed="${d.date === selDay}"><span class="tag">${dayLabel(d.date) || "&nbsp;"}</span><span class="d">${dShort(d.date)}</span><span class="dt">${dDM(d.date)}</span><span class="tt">${num(d.min)}°–${num(d.max)}°</span><span class="rr">☂ ${d.rain == null ? "—" : num(d.rain) + "%"}</span></button>`).join("");
  $("r-occ").innerHTML = Object.entries(OCC).map(([k, x]) => `<button type="button" data-occ="${k}" aria-pressed="${k === o}">${x.label}<small>${x.sub}</small></button>`).join("");
  const cur = perFor(o);
  $("r-per").innerHTML = `<span class="eyebrow" style="align-self:center;margin-right:4px">Período</span>` + Object.entries(PER).map(([k, x]) => `<button type="button" data-per="${k}" aria-pressed="${k === cur}">${x.label}<small>${x.sub} · ${perReal(f, k) ? "" : "~"}${perT(f, k)} °C</small></button>`).join("");
  $("r-note").innerHTML = poolNote();
  const rk = ranked(f, o);
  if (!rk.length) { $("r-feat").innerHTML = `<div class="empty">Nenhum perfume disponível ainda.</div>`; $("r-rank").innerHTML = ""; $("r-week").innerHTML = ""; return }
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
  $("r-rank").innerHTML = rk.slice(0, 12).map((r, i) => `<button type="button" data-feat="${esc(r.p.id)}" aria-current="${r.p.id === feat}"><span class="pos">${i + 1}º</span><span style="min-width:0">${esc(r.p.name)}<small>${esc(r.p.house || "")}${r.p.forSale ? " · " + brl(r.p.price) : ""}</small></span><span class="bar"><i style="width:${r.sc.total}%;background:${r.sc.total >= 80 ? 'var(--ok)' : r.sc.total >= 65 ? 'var(--accent)' : r.sc.total >= 50 ? 'var(--muted)' : 'var(--warm)'}"></i></span><span class="mono" style="text-align:right">${r.sc.total}</span></button>`).join("");
  $("r-week").innerHTML = `<table><thead><tr><th></th>${FC.map(d => `<th>${dayLabel(d.date) || dShort(d.date)}<small>${dDM(d.date)} · ${num(d.min)}–${num(d.max)}°</small></th>`).join("")}</tr></thead><tbody>
    ${Object.keys(OCC).map(oo => `<tr><th>${OCC[oo].label}<small>${PER[perFor(oo)].label}</small></th>${FC.map(d => { const b = ranked(d, oo)[0]; const [c] = lvl(b.sc.total); return `<td><button class="cell ${c}" type="button" data-cell="${d.date}|${oo}" aria-current="${d.date === selDay && oo === o}"><b>${esc(b.p.name)}</b><span>${b.sc.total}</span></button></td>` }).join("")}</tr>`).join("")}</tbody></table>`;
  $("r-src").innerHTML = srcText();
}
const srcText = () => `<strong>Fontes:</strong> ${FC_SRC === "open-meteo" ? `previsão do <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> para ${esc(placeName(activeAddr()))}` : "previsão de exemplo (não consegui carregar a previsão real agora)"}; acordes e notas do <a href="https://www.fragrantica.com" target="_blank" rel="noopener">Fragrantica</a>. Estação, ocasião, temperatura ideal e projeção são estimativas. Frascos ilustrativos.`;
$("r-days").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (!b) return; selDay = b.dataset.day; feat = null; renderR() });
$("r-occ").addEventListener("click", e => { const b = e.target.closest("[data-occ]"); if (!b) return; selOcc = b.dataset.occ; store.set("occ", selOcc); perManual = false; selPer = OCC[selOcc].per; feat = null; renderR() });
$("r-per").addEventListener("click", e => { const b = e.target.closest("[data-per]"); if (!b) return; selPer = b.dataset.per; perManual = true; feat = null; renderR() });
$("r-rank").addEventListener("click", e => { const b = e.target.closest("[data-feat]"); if (!b) return; feat = b.dataset.feat; renderR() });
$("r-week").addEventListener("click", e => { const b = e.target.closest("[data-cell]"); if (!b) return; [selDay, selOcc] = b.dataset.cell.split("|"); feat = null; renderR(); window.scrollTo({ top: 0, behavior: "smooth" }) });

/* ações comuns: comprar, favoritar, armário, abrir perfil */
document.addEventListener("click", async e => {
  const add = e.target.closest("[data-add]"), fv = e.target.closest("[data-favt]"), op = e.target.closest("[data-open]"), wt = e.target.closest("[data-wt]");
  if (add) { addToCart(add.dataset.add); return }
  if (fv) { fv.disabled = true; try { favs = await api.toggleFavorite(fv.dataset.favt); toast(favs.includes(fv.dataset.favt) ? "Adicionado aos favoritos." : "Removido dos favoritos."); go(tab) } catch (err) { toast(api.errMsg(err)) } finally { fv.disabled = false } return }
  if (wt) { await toggleWardrobe(wt.dataset.wt); go(tab); return }
  if (op) { e.preventDefault(); shopSel = op.dataset.open; go("loja"); setTimeout(() => $("s-det").scrollIntoView({ behavior: "smooth" }), 50) }
});
async function toggleWardrobe(id, custom) {
  const w = Array.isArray(me.wardrobe) ? [...me.wardrobe] : [], i = w.findIndex(x => x.id === id);
  if (i >= 0) w.splice(i, 1); else { const p = infoById(id) || custom; if (!p) return; w.push({ id, name: p.name, house: p.house || "", added_at: new Date().toISOString() }) }
  try { me = await api.updateProfile({ wardrobe: w }); toast(i >= 0 ? "Removido do armário." : "Adicionado ao armário.") } catch (err) { toast(api.errMsg(err)) }
}
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
    ${p.forSale ? `<div class="buyrow"><span class="price-tag">${brl(p.price)}</span><span class="stock ${p.stock <= 3 ? "low" : ""}">${p.stock <= 0 ? "Esgotado" : p.stock <= 3 ? `Últimas ${p.stock}` : ""}</span></div>` : ""}
    ${buyBtns(p, true)}</div></div>`;
}
function renderShop() {
  $("s-filt").innerHTML = SFILT.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${shopFilt === k}">${l}</button>`).join("");
  const q = norm($("s-q").value.trim()), sort = $("s-sort").value;
  let rows = P().map(p => ({ p, m: profileMatch(p, me?.olfactive_profile).total }))
    .filter(({ p, m }) => shopPasses(p, m) && (!q || norm([p.name, p.house, p.family, ...(p.notes?.top || []), ...(p.notes?.mid || []), ...(p.notes?.base || [])].join(" ")).includes(q)));
  rows.sort(sort === "price-asc" ? (a, b) => a.p.price - b.p.price : sort === "price-desc" ? (a, b) => b.p.price - a.p.price : sort === "name" ? (a, b) => a.p.name.localeCompare(b.p.name) : (a, b) => b.m - a.m);
  $("s-count").textContent = `${rows.length} perfumes`;
  $("s-tiles").innerHTML = rows.length ? rows.map(({ p, m }) => tileHTML(p, m)).join("") : `<div class="empty">${storeEmpty() ? `A loja ainda não tem perfumes à venda.${me?.role === "admin" ? ` <a href="#admin">Colocar perfumes à venda no Admin</a>` : " Volte em breve."}` : "Nenhum perfume neste filtro."}</div>`;
  const p = shopSel && (byId(shopSel) || (refById(shopSel) && { ...refById(shopSel), forSale: false }));
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
    <div class="brk">${brkRow("Acordes", m.acc, "parecido com o seu perfil olfativo")}${brkRow("Ocasiões", m.occ, "onde você mais usa")}${brkRow("Intensidade", m.int, "projeção e fixação do seu perfil")}${brkRow("Estação", m.se, "épocas que combinam com você")}${brkRow("Dia e noite", m.tm, "horário em que você usa")}</div>
    ${p.forSale ? `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="price-tag">${brl(p.price)}<small>${esc(p.volume || "")}</small></span><span class="stock ${p.stock <= 3 ? "low" : ""}">${p.stock <= 0 ? "Esgotado" : p.stock <= 5 ? `Últimas ${p.stock}` : "Disponível"}</span></div>` : ""}
    ${buyBtns(p)}</section></div>
  <section class="fc"><div class="card-head"><h2>Quando usar</h2><span class="when">estimativa · 0–100</span></div>
    <div class="seasons">${cols.map(([n, v, c]) => `<div class="season"><div class="vbar"><i style="height:${pct(v)}%;background:${c}"></i></div><span>${n}</span><span class="mono">${pct(v)}</span></div>`).join("")}</div>
    <div><span class="eyebrow">Temperatura ideal: ${tmin}–${tmax} °C</span><div class="temp"><div class="axis"></div><div class="band" style="left:${X(tmin)}%;width:${Math.max(2, X(tmax) - X(tmin))}%"></div>${f ? `<div class="mk" style="left:${X(num(f.max))}%"></div>` : ""}${[0, 10, 20, 30, 40].map(v => `<span class="tick" style="left:${X(v)}%">${v}°</span>`).join("")}</div>
    ${f ? `<p class="status" style="margin:4px 0 0">Linha tracejada: máxima de ${esc(dLong(f.date))} em ${esc(placeName(activeAddr()))} (${num(f.max)} °C).</p>` : ""}</div>
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
const initials = n => String(n || "?").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
function avatarHTML(u, size = 96) { return u?.avatar ? `<img class="avatar" src="${esc(u.avatar)}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">` : `<span class="avatar ph" style="width:${size}px;height:${size}px;font-size:${size * .38}px">${esc(initials(u?.name))}</span>` }
/* melhor ocasião de hoje para um perfume */
function bestToday(p, f) { let best = null; for (const o of Object.keys(OCC)) { const sc = fullScore(p, f, o); if (!best || sc.total > best.sc.total) best = { o, sc } } return best }
let addrEdit = null, wardQ = "";
async function renderProfile() {
  orders = await api.myOrders().catch(() => orders);
  const prof = me?.olfactive_profile, A = activeAddr(), f = FC.find(x => x.date === todayISO()) || FC[0];
  const top = pool().filter(p => p.accords).map(p => ({ p, b: bestToday(p, f) })).sort((a, b) => b.b.sc.total - a.b.sc.total).slice(0, 3);
  const W = wardrobe(), wScored = W.filter(w => w.info?.accords).map(w => ({ w, b: bestToday(w.info, f) })).sort((a, b) => b.b.sc.total - a.b.sc.total);
  $("u-body").innerHTML = `
  <section class="card phead">
    <label class="avwrap" title="Trocar foto">${avatarHTML(me, 96)}<span class="avedit">Trocar foto</span><input type="file" id="u-photo" accept="image/*" hidden></label>
    <div style="min-width:0;display:grid;gap:4px">
      <div class="eyebrow">${esc(me?.email || "")} ${me?.role === "admin" ? '<span class="pill admin">admin</span>' : ""} ${api.mode === "demo" ? '<span class="pill demo">modo demo</span>' : ""}</div>
      <h1 style="font-size:clamp(26px,5vw,38px)">${esc(me?.name || "Seu perfil")}</h1>
      ${prof ? `<div><span class="family" style="font-size:13px">${esc(prof.family)}</span></div>` : ""}
    </div>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" type="button" id="b-redo">Refazer o quiz</button><button class="btn ghost" type="button" id="b-out">Sair</button></div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Hoje em ${esc(placeName(A))}</h2><span class="when">${esc(dLong(f.date))}</span></div>
    <div class="row" role="group" aria-label="Escolha o endereço do clima">${addrs().map(a => `<button class="chipbtn" type="button" data-wx="${esc(a.id)}" aria-pressed="${a.id === A.id}">${esc(a.label)}</button>`).join("")}<a class="linkbtn" href="#" data-goaddr>Gerenciar endereços</a></div>
    <div class="wxday">
      <div class="wxbig"><span class="mono">${num(f.max)}°</span><small>mín. ${num(f.min)}° · ${esc(f.cond || "")}</small></div>
      <div class="wxper">${Object.entries(PER).map(([k, x]) => `<div><span class="eyebrow">${x.label}</span><b class="mono">${perReal(f, k) ? "" : "~"}${perT(f, k)}°</b><small class="r">☂ ${perRain(f, k) == null ? "—" : num(perRain(f, k)) + "%"}</small></div>`).join("")}</div>
    </div>
    <div class="wx">${wxChips(f)}</div>
  </section>

  <div class="occ">
    <section class="card"><div class="card-head"><h2>Top 3 para você hoje</h2><span class="when">perfil + clima de ${esc(placeName(A))}</span></div>
      ${poolNote()}
      <div class="top3">${top.map(({ p, b }, i) => { const [c, l] = lvl(b.sc.total); return `<div class="t3"><span class="pos mono">${i + 1}º</span>${bottle(liquid(p))}<div style="min-width:0"><a href="#" data-open="${esc(p.id)}" class="tn">${esc(p.name)}</a><div class="th">${esc(p.house || "")}${p.forSale ? " · " + brl(p.price) : ""}</div><div class="th">Melhor para <b>${esc(OCC[b.o].label.toLowerCase())}</b> · ${PER[b.sc.per].label.toLowerCase()} · ${b.sc.T} °C</div>${p.forSale ? `<button class="sbtn" type="button" data-add="${esc(p.id)}" style="margin-top:6px">Comprar · ${brl(p.price)}</button>` : ""}</div><span class="score sm ${c}">${b.sc.total}</span></div>` }).join("")}</div>
      <button class="btn" type="button" onclick="location.hash='hoje'">Ver o dia completo</button>
    </section>
    <section class="card"><div class="card-head"><h2>Do seu armário, hoje</h2></div>
      ${wScored.length ? `<div class="sim">${wScored.slice(0, 4).map(({ w, b }) => `<div class="sim-row"><div>${esc(w.name)} <small>${esc(OCC[b.o].label)} · ${PER[b.sc.per].label.toLowerCase()}</small></div><div class="bar"><i style="width:${b.sc.total}%;background:${b.sc.total >= 80 ? 'var(--ok)' : b.sc.total >= 65 ? 'var(--accent)' : 'var(--muted)'}"></i></div><span class="mono" style="text-align:right">${b.sc.total}</span></div>`).join("")}</div><p class="hint">Qual dos seus perfumes rende melhor hoje, pelo clima e pelo seu perfil.</p>` : `<div class="empty">Adicione no armário os perfumes que você já tem para ver qual usar hoje.</div>`}
    </section>
  </div>

  ${prof ? `<section class="card"><div class="profile-hero"><div style="display:grid;gap:12px">
      <span class="eyebrow">Seu perfil olfativo</span><div class="pname" style="font-size:clamp(28px,5vw,40px)">${esc(prof.family)}</div>
      <p class="why" style="font-size:15.5px">${esc(prof.summary)}</p>
      <div class="occfit"><span>Projeção <b>${INT_PT[Math.round(prof.intensity)]}</b></span><span>Fixação <b>${LON_PT[Math.round(prof.longevity)]}</b></span><span>${prof.daytime.dia >= prof.daytime.noite ? "Mais de <b>dia</b>" : "Mais de <b>noite</b>"}</span>${prof.base ? `<span>Base: <b>${esc(prof.base.name)} ${Math.round(prof.base.weight * 100)}%</b></span>` : ""}</div>
      <div class="acc">${accRows(prof.accords.slice(0, 6))}</div></div>
      <div class="radar">${radar(prof)}</div></div></section>` : `<div class="empty">Você ainda não respondeu o quiz.</div>`}

  <section class="card" id="u-ward">
    <div class="card-head"><h2>Meu armário</h2><span class="when">${W.length} perfume${W.length === 1 ? "" : "s"}</span></div>
    <div style="position:relative"><input id="w-q" type="search" placeholder="Adicionar perfume que você tem: busque pelo nome" autocomplete="off" value="${esc(wardQ)}" aria-label="Adicionar ao armário"><div class="results" id="w-res"></div></div>
    <div class="wardrobe">${W.length ? W.map(w => { const i = w.info, b = i?.accords ? bestToday(i, f) : null; return `<div class="wcard">${bottle(i ? liquid(i) : "#B9C7CF")}<div style="min-width:0"><div class="tn">${esc(w.name)}</div><div class="th">${esc(w.house || "")}</div>${i ? mini(i.accords) : '<span class="hint">sem dados de acordes</span>'}${w.source === "compra" ? `<span class="pill" style="margin-top:6px">Comprado aqui · ${esc(ST_PT[w.status] || "")}</span>` : ""}${b ? `<span class="fit ${b.sc.total >= 80 ? "ok" : ""}">Hoje: ${b.sc.total} · ${esc(OCC[b.o].label)}</span>` : ""}</div>${w.source === "compra" ? "" : `<button class="x" type="button" data-wrm="${esc(w.id)}" aria-label="Tirar do armário">×</button>`}</div>` }).join("") : `<div class="empty" style="grid-column:1/-1">Seu armário está vazio.</div>`}</div>
  </section>

  <section class="card" id="u-addr">
    <div class="card-head"><h2>Meus endereços</h2><button class="sbtn" type="button" data-anew>＋ Novo endereço</button></div>
    <p class="hint" style="margin:0">Salve a sua casa, a casa de praia, a casa de um familiar ou um lugar de viagem. O endereço marcado com ☀ é o usado para o clima.</p>
    <div class="addrs">${addrs().map(a => `<div class="addr ${a.id === A.id ? "on" : ""}"><div style="min-width:0"><div class="row" style="gap:6px"><strong>${esc(a.label)}</strong>${a.id === A.id ? '<span class="pill admin">☀ clima</span>' : ""}${a.partial ? '<span class="pill">incompleto</span>' : ""}${!isBR(a) ? `<span class="pill">${esc(a.pais)}</span>` : ""}</div><div class="house" style="font-size:13px">${addrLine(a)}</div>${a.dest ? `<div class="house" style="font-size:12.5px">Para: ${esc(a.dest)}${a.tel ? " · " + esc(a.tel) : ""}</div>` : ""}</div>
      <div class="row" style="gap:6px">${a.id !== A.id ? `<button class="sbtn" type="button" data-wx="${esc(a.id)}">Usar para o clima</button>` : ""}<button class="sbtn" type="button" data-aedit="${esc(a.id)}">${a.partial ? "Completar" : "Editar"}</button>${addrs().length > 1 ? `<button class="danger" type="button" data-adel="${esc(a.id)}" style="padding:6px 10px">Excluir</button>` : ""}</div></div>`).join("")}</div>
    <div id="a-form"></div>
  </section>

  <section class="card"><div class="card-head"><h2>Meus dados</h2></div>
    <form id="f-me" class="grid2"><label class="f">Nome<input name="name" value="${esc(me?.name || "")}"></label><div style="align-self:end"><button class="btn" type="submit">Salvar</button></div></form>
    <div class="status" id="u-st" role="status"></div></section>

  <section class="card"><div class="card-head"><h2>Meus pedidos</h2></div><div class="orders">${orders.length ? orders.map(orderHTML).join("") : `<div class="empty">Nenhum pedido ainda.</div>`}</div></section>`;
  if (addrEdit) $("a-form").innerHTML = addrFormHTML(addrs().find(a => a.id === addrEdit) || {});
  if (wardQ) wardSearch();
}
function wardSearch() {
  const q = $("w-q").value; wardQ = q; const r = searchPerfumes(q, P());
  $("w-res").innerHTML = q.trim() ? r.map(p => `<button class="resbtn" type="button" data-wadd="${esc(p.id)}">${esc(p.name)} <small>${esc(p.house || "")}</small></button>`).join("") + `<button class="resbtn" type="button" data-wcustom>＋ Adicionar “${esc(q.trim())}” sem dados</button>` : "";
}
const ST_PT = { aguardando_pagamento: "Aguardando pagamento", pago: "Pago", comprado_fornecedor: "Em separação", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
function orderHTML(o) {
  const a = o.shipping_address || {};
  return `<div class="order"><div class="row"><span class="mono">#${esc(String(o.id).slice(0, 8))} · ${esc(dtBR(o.created_at))}</span><span class="verdict st-${esc(o.status)}">${esc(ST_PT[o.status] || o.status)}</span></div>
    <div>${(o.items || []).map(i => `${i.qty}× ${esc(i.name)} <span class="house">${esc(i.house || "")}</span>`).join("<br>")}</div>
    ${a.label ? `<div class="house" style="font-size:13px">Entrega em: ${esc(a.label)} · ${addrLine(a)}</div>` : ""}
    ${o.tracking ? `<div style="font-size:13px">Rastreio: <b class="mono">${esc(o.tracking)}</b></div>` : ""}
    <div class="row"><span class="house">Frete ${o.shipping ? brl(o.shipping) : "grátis"}</span><strong>${brl(o.total)}</strong></div></div>`;
}
/* formulário de endereço (perfil e carrinho) */
const LABELS = ["Casa", "Trabalho", "Praia", "Campo", "Família", "Viagem"];
function addrFormHTML(a, ctx = "perfil") {
  const br = isBR(a);
  return `<form class="addrform" data-ctx="${ctx}" data-id="${esc(a.id || "")}">
    <div class="card-head"><h3>${a.id ? (a.partial ? "Completar endereço" : "Editar endereço") : "Novo endereço"}</h3></div>
    <label class="f">Apelido<input name="label" required value="${esc(a.partial ? "" : a.label || "")}" placeholder="Casa, Praia, Casa da mãe…" list="labels"></label>
    <datalist id="labels">${LABELS.map(l => `<option value="${l}">`).join("")}</datalist>
    <div class="grid2"><label class="f">País<select name="pais_sel"><option value="Brasil" ${br ? "selected" : ""}>Brasil</option><option value="outro" ${!br ? "selected" : ""}>Outro país</option></select></label>
      <label class="f" data-only="intl" ${br ? "hidden" : ""}>Qual país<input name="pais" value="${esc(br ? "" : a.pais || "")}" placeholder="Portugal, Estados Unidos…"></label>
      <label class="f" data-only="br" ${br ? "" : "hidden"}>CEP<input name="cep" inputmode="numeric" placeholder="00000-000" maxlength="9" value="${esc(a.cep || "")}"></label></div>
    <label class="f">Rua / endereço<input name="rua" required value="${esc(a.rua || "")}"></label>
    <div class="grid2"><label class="f">Número<input name="numero" required value="${esc(a.numero || "")}"></label><label class="f">Complemento<input name="comp" value="${esc(a.comp || "")}"></label></div>
    <div class="grid2"><label class="f">Bairro<input name="bairro" value="${esc(a.bairro || "")}"></label><label class="f">Cidade<input name="cidade" required value="${esc(a.partial ? (a.cidade || "").split(",")[0] : a.cidade || "")}"></label><label class="f">Estado / UF<input name="uf" value="${esc(a.uf || "")}" maxlength="30"></label></div>
    <div class="grid2"><label class="f">Quem recebe<input name="dest" value="${esc(a.dest || me?.name || "")}"></label><label class="f">Telefone<input name="tel" inputmode="tel" value="${esc(a.tel || "")}" placeholder="(11) 90000-0000"></label></div>
    <label class="switch"><input type="checkbox" name="wx" ${!a.id || a.id === activeAddr().id ? "checked" : ""}> Usar este endereço para o clima</label>
    <div class="row"><button class="btn" type="submit">Salvar endereço</button><button class="btn ghost" type="button" data-acancel>Cancelar</button></div>
    <div class="status" data-ast></div></form>`;
}
function bindAddrForm(form) {
  const ps = form.pais_sel, toggle = () => { const br = ps.value === "Brasil"; form.querySelector('[data-only="intl"]').hidden = br; form.querySelector('[data-only="br"]').hidden = !br };
  ps.addEventListener("change", toggle);
  form.cep.addEventListener("blur", async () => { const c = form.cep.value.replace(/\D/g, ""); if (c.length !== 8) return; try { const j = await (await fetch(`https://viacep.com.br/ws/${c}/json/`)).json(); if (!j.erro) { form.rua.value ||= j.logradouro || ""; form.bairro.value ||= j.bairro || ""; form.cidade.value = j.localidade || form.cidade.value; form.uf.value = j.uf || form.uf.value } } catch (e) {} });
}
async function saveAddrForm(form) {
  const st = form.querySelector("[data-ast]"), br = form.pais_sel.value === "Brasil";
  const v = k => form[k].value.trim();
  if (br && v("cep").replace(/\D/g, "").length !== 8) { st.textContent = "Digite um CEP válido."; return null }
  if (!br && !v("pais")) { st.textContent = "Diga qual é o país."; return null }
  st.textContent = "Localizando a cidade para a previsão…";
  const pais = br ? "Brasil" : v("pais"), geo = await geocode(v("cidade") + (v("uf") ? ", " + v("uf") : ""), pais);
  const id = form.dataset.id || uidLocal(), old = addrs().find(a => a.id === id) || {};
  const a = { id, label: v("label"), pais, cep: br ? v("cep") : "", rua: v("rua"), numero: v("numero"), comp: v("comp"), bairro: v("bairro"), cidade: v("cidade"), uf: v("uf"), dest: v("dest"), tel: v("tel"), lat: geo?.lat ?? old.lat ?? CFG.DEFAULT_CITY.lat, lon: geo?.lon ?? old.lon ?? CFG.DEFAULT_CITY.lon, geo: geo?.name || old.geo || v("cidade") };
  const list = addrs().some(x => x.id === id) ? addrs().map(x => x.id === id ? a : x) : [...addrs(), a];
  const patch = { addresses: list }; if (form.wx.checked || !me.active_address) patch.active_address = id;
  try { me = await api.updateProfile(patch); if (patch.active_address) await useAddrWeather(); toast(geo ? "Endereço salvo." : "Endereço salvo. Não achei a cidade no mapa, então o clima usa a localização anterior."); return a }
  catch (err) { st.textContent = api.errMsg(err); return null }
}
$("u-body").addEventListener("click", async e => {
  const t = e.target;
  if (t.id === "b-redo") { startQuiz(true); return }
  if (t.id === "b-out") { await api.signOut(); me = null; cart = []; saveCart(); showView("landing"); authTab(false); return }
  const wx = t.closest("[data-wx]"); if (wx) { me = await api.updateProfile({ active_address: wx.dataset.wx }); await useAddrWeather(); renderProfile(); return }
  if (t.closest("[data-goaddr]")) { e.preventDefault(); $("u-addr").scrollIntoView({ behavior: "smooth" }); return }
  if (t.closest("[data-anew]")) { addrEdit = "new"; $("a-form").innerHTML = addrFormHTML({}); bindAddrForm($("a-form").querySelector("form")); $("a-form").scrollIntoView({ behavior: "smooth", block: "center" }); return }
  const ae = t.closest("[data-aedit]"); if (ae) { addrEdit = ae.dataset.aedit; $("a-form").innerHTML = addrFormHTML(addrs().find(a => a.id === addrEdit) || {}); bindAddrForm($("a-form").querySelector("form")); $("a-form").scrollIntoView({ behavior: "smooth", block: "center" }); return }
  if (t.closest("[data-acancel]")) { addrEdit = null; $("a-form").innerHTML = ""; return }
  const ad = t.closest("[data-adel]"); if (ad) { if (!ad.dataset.sure) { ad.dataset.sure = 1; ad.textContent = "Confirmar"; ad.classList.add("sure"); return } const list = addrs().filter(a => a.id !== ad.dataset.adel); me = await api.updateProfile({ addresses: list, active_address: me.active_address === ad.dataset.adel ? list[0]?.id : me.active_address }); await useAddrWeather(); renderProfile(); return }
  const wa = t.closest("[data-wadd]"); if (wa) { wardQ = ""; await toggleWardrobe(wa.dataset.wadd); renderProfile(); return }
  if (t.closest("[data-wcustom]")) { const n = $("w-q").value.trim(); wardQ = ""; await toggleWardrobe("custom-" + norm(n).replace(/[^a-z0-9]+/g, "-"), { name: n, house: "" }); renderProfile(); return }
  const wr = t.closest("[data-wrm]"); if (wr) { await toggleWardrobe(wr.dataset.wrm); renderProfile(); return }
});
$("u-body").addEventListener("input", e => { if (e.target.id === "w-q") wardSearch() });
$("u-body").addEventListener("change", async e => {
  if (e.target.id !== "u-photo" || !e.target.files[0]) return;
  try { const url = await resizeImage(e.target.files[0], 256); me = await api.updateProfile({ avatar: url }); toast("Foto atualizada."); renderProfile() } catch (err) { toast(api.errMsg(err)) }
});
$("u-body").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target;
  if (f.id === "f-me") { try { me = await api.updateProfile({ name: f.name.value.trim() }); $("u-st").textContent = "Dados salvos." } catch (err) { $("u-st").textContent = api.errMsg(err) } return }
  if (f.classList.contains("addrform")) { const b = f.querySelector("button[type=submit]"); b.disabled = true; const a = await saveAddrForm(f); b.disabled = false; if (a) { addrEdit = null; renderProfile() } }
});
function resizeImage(file, size) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error("Escolha um arquivo de imagem."));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = size; const s = Math.min(img.width, img.height), ctx = c.getContext("2d");
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", .82)) };
    img.onerror = () => rej(new Error("Não consegui abrir essa imagem.")); img.src = url;
  });
}

/* ---------------- Carrinho ---------------- */
let ship = { free_shipping_over: 299, shipping_fee: 19.9 }, coAddr = null, coForm = false;
function renderCart() {
  cart = cart.filter(i => byId(i.id)); saveCart();
  if (!cart.length) { $("c-body").innerHTML = `<div class="empty">Seu carrinho está vazio. <a href="#loja">Ir para a loja</a></div>`; return }
  const lines = cart.map(i => ({ ...i, p: byId(i.id) })), sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0), fr = sub >= ship.free_shipping_over ? 0 : ship.shipping_fee;
  const ok = addrs().filter(addrComplete);
  if (!coAddr || !ok.some(a => a.id === coAddr)) coAddr = (ok.find(a => a.id === me.active_address && isBR(a)) || ok.find(isBR) || {}).id || null;
  const sel = ok.find(a => a.id === coAddr), canBuy = sel && isBR(sel);
  $("c-body").innerHTML = `<div class="cart"><section class="card"><div class="card-head"><h2>Itens</h2><span class="when">${lines.length} perfume${lines.length > 1 ? "s" : ""}</span></div>
    <div>${lines.map(l => `<div class="cline">${bottle(liquid(l.p))}<div style="min-width:0"><div class="an" style="font-family:var(--display);font-weight:700">${esc(l.p.name)}</div><div class="house">${esc(l.p.house)} · ${esc(l.p.volume || "")} · ${brl(l.p.price)}</div>
      <div class="row" style="margin-top:6px"><span class="qty"><button type="button" data-q="${esc(l.id)}|-1" aria-label="Menos">−</button><span>${l.qty}</span><button type="button" data-q="${esc(l.id)}|1" aria-label="Mais">+</button></span><button class="linkbtn" type="button" data-q="${esc(l.id)}|0">Remover</button></div></div>
      <strong class="mono">${brl(l.p.price * l.qty)}</strong></div>`).join("")}</div></section>
    <section class="card"><div class="card-head"><h2>Entregar em</h2><button class="sbtn" type="button" data-conew>＋ Novo endereço</button></div>
      <div class="addrs">${ok.length ? ok.map(a => `<label class="addr pick ${a.id === coAddr ? "on" : ""} ${isBR(a) ? "" : "off"}"><input type="radio" name="co-addr" value="${esc(a.id)}" ${a.id === coAddr ? "checked" : ""} ${isBR(a) ? "" : "disabled"}><div style="min-width:0"><strong>${esc(a.label)}</strong><div class="house" style="font-size:13px">${addrLine(a)}</div>${isBR(a) ? "" : '<div class="hint">Por enquanto entregamos só no Brasil.</div>'}</div></label>`).join("") : `<p class="hint">Cadastre um endereço completo para receber o pedido.</p>`}</div>
      <div id="co-form">${coForm || !ok.length ? addrFormHTML({}, "cart") : ""}</div>
      <div class="sumrow"><span>Subtotal</span><span class="mono">${brl(sub)}</span></div>
      <div class="sumrow"><span>Frete</span><span class="mono">${fr ? brl(fr) : "grátis"}</span></div>
      ${fr ? `<p class="hint">Frete grátis acima de ${brl(ship.free_shipping_over)}.</p>` : ""}
      <div class="sumrow total"><span>Total</span><span>${brl(sub + fr)}</span></div>
      <button class="btn" type="button" id="b-co" ${canBuy ? "" : "disabled"}>${CFG.CHECKOUT_MODE === "mercadopago" ? "Pagar com Mercado Pago" : "Fechar pedido"}</button>
      ${CFG.CHECKOUT_MODE !== "mercadopago" ? `<p class="hint"><strong>Modo teste:</strong> nenhum pagamento é cobrado. O pedido fica como “aguardando pagamento” e o admin pode marcá-lo como pago.</p>` : ""}
      <div class="status" id="co-st" role="status"></div></section></div>`;
  const fm = $("co-form").querySelector("form"); if (fm) bindAddrForm(fm);
}
$("c-body").addEventListener("click", async e => {
  const b = e.target.closest("[data-q]");
  if (b) { const [id, d] = b.dataset.q.split("|"), it = cart.find(i => i.id === id), p = byId(id); if (!it) return;
    if (d === "0") cart = cart.filter(i => i.id !== id); else it.qty = Math.max(1, Math.min(10, p?.stock ?? 10, it.qty + +d)); saveCart(); renderCart(); return }
  if (e.target.closest("[data-conew]")) { coForm = true; renderCart(); $("co-form").scrollIntoView({ behavior: "smooth", block: "center" }); return }
  if (e.target.closest("[data-acancel]")) { coForm = false; renderCart(); return }
  if (e.target.id === "b-co") {
    const a = addrs().find(x => x.id === coAddr); if (!a) return; const btn = e.target; btn.disabled = true; $("co-st").textContent = "Registrando o pedido…";
    try {
      const oid = await api.placeOrder(cart.map(i => ({ id: i.id, qty: i.qty })), { label: a.label, dest: a.dest, cep: a.cep, rua: a.rua, numero: a.numero, comp: a.comp, bairro: a.bairro, cidade: a.cidade, uf: a.uf, pais: a.pais, tel: a.tel });
      const pay = await api.startPayment(oid).catch(() => null);
      cart = []; saveCart(); products = await api.products(); orders = await api.myOrders().catch(() => orders);
      if (pay) { location.href = pay; return }
      toast("Pedido registrado!"); go("perfil");
    } catch (err) { $("co-st").textContent = api.errMsg(err); $("co-st").classList.add("err"); btn.disabled = false; products = await api.products().catch(() => products) }
  }
});
$("c-body").addEventListener("change", e => { if (e.target.name === "co-addr") { coAddr = e.target.value; renderCart() } });
$("c-body").addEventListener("submit", async e => { e.preventDefault(); const f = e.target; if (!f.classList.contains("addrform")) return; const b = f.querySelector("button[type=submit]"); b.disabled = true; const a = await saveAddrForm(f); b.disabled = false; if (a) { coForm = false; coAddr = a.id; renderCart() } });

/* ---------------- Admin ---------------- */
let adSub = "pedidos", adEdit = null, adQ = "";
async function renderAdmin() {
  if (me?.role !== "admin") { go("hoje"); return }
  $("ad-body").innerHTML = `<div class="status">Carregando…</div>`;
  let users = [], ords = [], settings = null, sup = {};
  try { [users, ords, settings, sup] = await Promise.all([api.adminUsers(), api.adminOrders(), api.adminSettings(), api.adminSuppliers()]); products = await api.products() } catch (err) { $("ad-body").innerHTML = `<div class="status err">${esc(api.errMsg(err))}</div>`; return }
  const costOf = o => (o.items || []).reduce((s, i) => s + num(sup[i.id]?.cost) * i.qty, 0);
  const paid = ords.filter(o => ["pago", "comprado_fornecedor", "enviado", "entregue"].includes(o.status));
  const rev = paid.reduce((s, o) => s + num(o.total), 0), cost = paid.reduce((s, o) => s + costOf(o), 0);
  $("ad-kpis").innerHTML = [["Cadastros", users.length], ["Quiz completo", users.filter(u => u.quiz_done_at).length], ["À venda", products.filter(p => p.active !== false).length], ["Pedidos", ords.length], ["Para comprar no fornecedor", ords.filter(o => o.status === "pago").length], ["Faturado", brl(rev)], ["Margem bruta", brl(rev - cost)]].map(([l, v]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("");
  $("ad-sub").innerHTML = [["pedidos", "Pedidos"], ["produtos", "Produtos e fornecedores"], ["usuarios", "Usuários"], ["config", "Configurações"]].map(([k, l]) => `<button type="button" data-s="${k}" aria-pressed="${adSub === k}">${l}</button>`).join("");
  const B = $("ad-body");
  if (adSub === "pedidos") B.innerHTML = ords.length ? ords.map(o => { const a = o.shipping_address || {}, c = costOf(o); return `<section class="card aorder">
      <div class="row" style="justify-content:space-between"><span class="mono">#${esc(String(o.id).slice(0, 8))} · ${esc(dtBR(o.created_at))}</span><span class="verdict st-${esc(o.status)}">${esc(ST_PT[o.status])}</span></div>
      <div class="grid2"><div><span class="eyebrow">Cliente</span><div>${esc(o.customer?.name || "—")}</div><div class="house">${esc(o.customer?.email || "")}</div></div>
        <div><span class="eyebrow">Entregar para</span><div>${esc([a.dest || o.customer?.name, a.tel].filter(Boolean).join(" · "))}</div><div class="house" style="font-size:13px">${a.label ? esc(a.label) + " · " : ""}${addrLine(a)}</div></div></div>
      <div class="tbl"><table style="min-width:520px"><thead><tr><th>Item</th><th>Qtd.</th><th>Venda</th><th>Custo</th><th>Fornecedor</th></tr></thead><tbody>${(o.items || []).map(i => { const s = sup[i.id] || {}; return `<tr><td>${esc(i.name)}<br><span class="house">${esc(i.house || "")} · ${esc(i.volume || "")}</span></td><td class="mono">${i.qty}</td><td class="mono">${brl(i.price * i.qty)}</td><td class="mono">${s.cost != null ? brl(s.cost * i.qty) : "—"}</td><td>${s.supplier_url ? `<a href="${esc(s.supplier_url)}" target="_blank" rel="noopener">Comprar em ${esc(s.supplier_name || "fornecedor")} ↗</a>` : '<span class="house">sem fornecedor</span>'}</td></tr>` }).join("")}</tbody></table></div>
      <div class="row" style="justify-content:space-between"><span>Total <b>${brl(o.total)}</b> · custo ${brl(c)} · margem <b>${brl(num(o.total) - c - num(o.shipping))}</b> <span class="house">(sem o frete)</span></span></div>
      <form class="row" data-ord="${esc(o.id)}"><select name="status" aria-label="Status">${window.ORDER_STATUS.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${ST_PT[s]}</option>`).join("")}</select><input name="tracking" placeholder="Código de rastreio" value="${esc(o.tracking || "")}" style="max-width:220px"><button class="sbtn" type="submit">Salvar</button></form>
    </section>` }).join("") : `<div class="empty">Nenhum pedido ainda.</div>`;
  if (adSub === "produtos") {
    const ed = adEdit && (products.find(p => p.id === adEdit) ? flatP(products.find(p => p.id === adEdit)) : refById(adEdit));
    const rows = REF.filter(r => !adQ || norm(r.name + " " + r.house).includes(norm(adQ))).map(r => ({ r, p: products.find(p => p.id === r.id), s: sup[r.id] }));
    B.innerHTML = `${ed ? productFormHTML(ed, products.find(p => p.id === ed.id), sup[ed.id] || {}) : ""}
      <p class="hint">A loja mostra só o que você colocar à venda. O fornecedor e o custo ficam visíveis apenas aqui no Admin.</p>
      <input type="search" id="ad-q" placeholder="Buscar na base de perfumes" value="${esc(adQ)}" style="max-width:360px">
      <div class="tbl"><table><thead><tr><th>Perfume</th><th>Status</th><th>Venda</th><th>Custo</th><th>Margem</th><th>Fornecedor</th><th></th></tr></thead><tbody>${rows.map(({ r, p, s }) => { const mg = p && s?.cost != null ? p.price - s.cost : null; return `<tr><td><strong>${esc(r.name)}</strong><br><span class="house">${esc(r.house)}</span></td><td>${p ? (p.active !== false ? '<span class="pill admin">à venda</span>' : '<span class="pill">pausado</span>') : '<span class="house">—</span>'}</td><td class="mono">${p ? brl(p.price) : ""}</td><td class="mono">${s?.cost != null ? brl(s.cost) : ""}</td><td class="mono">${mg != null ? `${brl(mg)}<br><span class="house">${p.price ? Math.round(mg / p.price * 100) : 0}%</span>` : ""}</td><td>${s?.supplier_url ? `<a href="${esc(s.supplier_url)}" target="_blank" rel="noopener">${esc(s.supplier_name || "link")} ↗</a>` : ""}</td><td><button class="sbtn" type="button" data-pedit="${esc(r.id)}">${p ? "Editar" : "Colocar à venda"}</button></td></tr>` }).join("")}</tbody></table></div>`;
  }
  if (adSub === "usuarios") B.innerHTML = `<div class="tbl"><table><thead><tr><th></th><th>Nome</th><th>E-mail</th><th>Clima em</th><th>Perfil olfativo</th><th>Armário</th><th>Cadastro</th></tr></thead><tbody>${users.map(u => { const A = (u.addresses || []).find(a => a.id === u.active_address) || (u.addresses || [])[0]; return `<tr><td>${avatarHTML(u, 36)}</td><td>${esc(u.name || "—")} ${u.role === "admin" ? '<span class="pill admin">admin</span>' : ""}</td><td>${esc(u.email)}</td><td>${A ? esc(A.label + " · " + placeName(A)) : ""}</td><td>${u.olfactive_profile ? `<strong>${esc(u.olfactive_profile.family)}</strong>${u.olfactive_profile.base ? `<div class="house" style="font-size:12px">base: ${esc(u.olfactive_profile.base.name)}</div>` : ""}${mini(u.olfactive_profile.accords)}` : '<span class="house">quiz pendente</span>'}</td><td class="mono">${(u.wardrobe || []).length}</td><td class="mono">${esc(dtBR(u.created_at))}</td></tr>` }).join("") || `<tr><td colspan="7">Nenhum cadastro.</td></tr>`}</tbody></table></div>`;
  if (adSub === "config") B.innerHTML = settings ? `<section class="card"><form id="f-cfg" style="display:grid;gap:14px">
      <label class="switch"><input type="checkbox" name="private_beta" ${settings.private_beta ? "checked" : ""}> Teste fechado: só entra quem tiver o código de convite</label>
      <div class="grid2"><label class="f">Código de convite<input name="invite_code" value="${esc(settings.invite_code)}"></label><label class="f">Frete grátis acima de (R$)<input name="free_shipping_over" inputmode="decimal" value="${num(settings.free_shipping_over)}"></label><label class="f">Valor do frete (R$)<input name="shipping_fee" inputmode="decimal" value="${num(settings.shipping_fee)}"></label></div>
      <p class="hint">E-mails com acesso de admin: ${(settings.admin_emails || []).map(esc).join(", ")}. ${api.mode === "supabase" ? "Para mudar, edite a tabela app_settings no Supabase." : ""}</p>
      <div class="row"><button class="btn" type="submit">Salvar configurações</button>${api.mode === "demo" ? `<button class="danger" type="button" id="b-reset">Apagar todos os dados do modo demo</button>` : ""}</div>
      <div class="status" id="cfg-st"></div></form></section>` : `<div class="status err">Sem acesso às configurações.</div>`;
}
function productFormHTML(r, p, s) {
  return `<section class="card" id="pform"><div class="card-head"><h2>${p ? "Editar" : "Colocar à venda"}: ${esc(r.name)}</h2><span class="when">${esc(r.house)}</span></div>
    <form id="f-prod" data-id="${esc(r.id)}" style="display:grid;gap:12px">
      <div class="grid2"><label class="f">Preço de venda (R$)<input name="price" required inputmode="decimal" value="${p ? num(p.price).toFixed(2).replace(".", ",") : ""}"></label><label class="f">Volume<input name="volume" value="${esc(p?.volume || "100 ml")}"></label><label class="f">Estoque disponível<input name="stock" type="number" min="0" value="${p ? num(p.stock) : 99}"></label></div>
      <div class="grid2"><label class="f">Fornecedor<input name="supplier_name" value="${esc(s.supplier_name || "")}" placeholder="Nome da loja"></label><label class="f">Link do produto no fornecedor<input name="supplier_url" type="url" value="${esc(s.supplier_url || "")}" placeholder="https://"></label><label class="f">Custo no fornecedor (R$)<input name="cost" inputmode="decimal" value="${s.cost != null ? num(s.cost).toFixed(2).replace(".", ",") : ""}"></label></div>
      <label class="switch"><input type="checkbox" name="active" ${!p || p.active !== false ? "checked" : ""}> Visível na loja</label>
      <div class="hint" id="pf-mg"></div>
      <div class="row"><button class="btn" type="submit">Salvar</button><button class="btn ghost" type="button" data-pcancel>Cancelar</button>${p ? `<button class="danger" type="button" data-prm="${esc(r.id)}">Tirar da loja</button>` : ""}</div></form></section>`;
}
$("ad-sub").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (!b) return; adSub = b.dataset.s; adEdit = null; renderAdmin() });
const parseBR = s => Number(String(s).replace(/[^\d,\.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
function updMargin() { const f = $("f-prod"); if (!f) return; const p = parseBR(f.price.value), c = parseBR(f.cost.value); $("pf-mg").textContent = Number.isFinite(p) && p > 0 && Number.isFinite(c) && f.cost.value.trim() ? `Margem por unidade: ${brl(p - c)} (${Math.round((p - c) / p * 100)}%), antes de frete e taxas.` : "" }
$("ad-body").addEventListener("input", e => { if (e.target.id === "ad-q") { adQ = e.target.value; const pos = e.target.selectionStart; renderAdmin().then(() => { const i = $("ad-q"); if (i) { i.focus(); i.setSelectionRange(pos, pos) } }) } else if (e.target.closest("#f-prod")) updMargin() });
$("ad-body").addEventListener("click", async e => {
  const pe = e.target.closest("[data-pedit]"); if (pe) { adEdit = pe.dataset.pedit; await renderAdmin(); updMargin(); $("pform")?.scrollIntoView({ behavior: "smooth" }); return }
  if (e.target.closest("[data-pcancel]")) { adEdit = null; renderAdmin(); return }
  const rm = e.target.closest("[data-prm]"); if (rm) { if (!rm.dataset.sure) { rm.dataset.sure = 1; rm.textContent = "Confirmar: tirar da loja"; rm.classList.add("sure"); return } try { await api.adminRemoveProduct(rm.dataset.prm); products = await api.products(); adEdit = null; toast("Perfume tirado da loja."); renderAdmin() } catch (err) { toast(api.errMsg(err)) } return }
  if (e.target.id === "b-reset") { if (e.target.dataset.sure) api.demoReset(); else { e.target.dataset.sure = 1; e.target.textContent = "Confirmar: apagar tudo"; e.target.classList.add("sure") } }
});
$("ad-body").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target;
  if (f.dataset.ord) { try { await api.adminUpdateOrder(f.dataset.ord, { status: f.status.value, tracking: f.tracking.value.trim() || null }); toast("Pedido atualizado."); renderAdmin() } catch (err) { toast(api.errMsg(err)) } return }
  if (f.id === "f-prod") {
    const r = refById(f.dataset.id), price = parseBR(f.price.value), stock = parseInt(f.stock.value, 10), cost = f.cost.value.trim() ? parseBR(f.cost.value) : null, url = f.supplier_url.value.trim();
    if (!Number.isFinite(price) || price <= 0) { toast("Digite um preço de venda válido."); return }
    if (!Number.isFinite(stock) || stock < 0) { toast("Estoque inválido."); return }
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) { toast("Custo inválido."); return }
    if (url && !/^https?:\/\//.test(url)) { toast("O link do fornecedor precisa começar com https://"); return }
    const { id, name, house, ...data } = r;
    try { await api.adminSaveProduct({ id, name, house, price, stock, volume: f.volume.value.trim(), active: f.active.checked, data }, { supplier_name: f.supplier_name.value.trim(), supplier_url: url, cost }); products = await api.products(); adEdit = null; toast(`${name} salvo.`); renderAdmin() } catch (err) { toast(api.errMsg(err)) }
    return;
  }
  if (f.id === "f-cfg") { try { await api.adminSaveSettings({ private_beta: f.private_beta.checked, invite_code: f.invite_code.value.trim(), free_shipping_over: parseBR(f.free_shipping_over.value), shipping_fee: parseBR(f.shipping_fee.value) }); ship = await api.shippingRules(); $("cfg-st").textContent = "Configurações salvas." } catch (err) { $("cfg-st").textContent = api.errMsg(err) } }
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
  [products, favs, ship, orders] = await Promise.all([api.products(), api.favorites().catch(() => []), api.shippingRules().catch(() => ship), api.myOrders().catch(() => [])]);
  cart = store.get(cartKey(), []); saveCart();
  await useAddrWeather();
  if (!me.quiz_done_at) { startQuiz(false); return }
  go(location.hash.slice(1) || "hoje");
}
await boot();
})();
