/* ============================================================
   GOAL ACHIEVER — motor
   Multi-usuario (familia) · encuesta de bienvenida que genera
   plan + metas · asistente local o Claude (BYOK).
   Mix de: Motion, Sunsama, Structured, 12 Week Year,
   GoalsOnTrack, Strides, Fabulous, Reclaim.
   ============================================================ */

"use strict";

/* ---------- utilidades ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoyISO = () => iso(new Date());
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.floor(min) % 60)}`;
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const diasEntre = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const addDias = (baseISO, n) => iso(new Date(parseISO(baseISO).getTime() + n * 86400000));
const DOWS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaLarga = (d) => `${DOWS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
const fmtMoney = (n) => "$" + Math.round(n).toLocaleString("en-US");
const uid = () => "u_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const initial = (n) => ((n || "").trim()[0] || "?").toUpperCase();

/* ============================================================
   CATÁLOGO DE ÁREAS  (encuesta → plan + metas)
   ============================================================ */
const AREAS = {
  salud: {
    label: "Salud y forma física", em: "🏃", tipo: "salud",
    act: { titulo: "Ejercicio · entreno del día", dur: 60, dias: [1, 2, 3, 4, 5, 6] },
    metaNombre: "Ponerme en mi mejor forma física",
    metrica: "Entrenar 5+ días por semana de forma constante",
    accion: "Hacer el entreno del día, sin excusas.",
    porque: "El cuerpo es la base de todo lo demás: energía, foco y disciplina se entrenan aquí.",
    horizonDef: "6a", hitos: [
      { t: "2 semanas seguidas entrenando", f: .08 },
      { t: "Primer mes completo de constancia", f: .22 },
      { t: "La rutina ya me sale natural", f: .45 },
      { t: "Salto visible de condición física", f: .72 },
      { t: "Mi mejor forma física", f: 1 },
    ],
  },
  trading: {
    label: "Trading / mercados", em: "📈", tipo: "trading",
    act: { titulo: "Sesión de trading · apertura de mercado", dur: 120, dias: [1, 2, 3, 4, 5] },
    metaNombre: "Ser rentable en trading",
    metrica: "3 meses consecutivos con profit factor > 1 en journal real",
    accion: "Sesión completa + journal honesto, cada día de mercado.",
    porque: "Rentable de verdad se mide con datos del journal, no con sensaciones. Honestidad brutal.",
    horizonDef: "1a", hitos: [
      { t: "30 sesiones seguidas con journal al 100%", f: .12 },
      { t: "Primer mes con profit factor > 1", f: .3 },
      { t: "Sizing consistente · máx. 1% de riesgo por trade", f: .55 },
      { t: "2 meses consecutivos con PF > 1", f: .8 },
      { t: "RENTABLE · 3 meses seguidos con PF > 1", f: 1 },
    ],
  },
  dinero: {
    label: "Dinero e ingresos", em: "💰", tipo: "dinero",
    act: { titulo: "Trabajo profundo · construir ingresos", dur: 120, dias: [1, 2, 3, 4, 5] },
    metaNombre: "Aumentar mis ingresos",
    metrica: "Duplicar mi ingreso mensual",
    accion: "Dos bloques de trabajo profundo al día en lo que genera dinero.",
    porque: "Los ingresos crecen con foco diario en lo que de verdad mueve la aguja, no en lo urgente.",
    horizonDef: "1a", hitos: [
      { t: "Definir mi fuente de ingreso principal", f: .1 },
      { t: "Primeros ingresos extra del proyecto", f: .3 },
      { t: "Sistema de captación de clientes funcionando", f: .55 },
      { t: "+50% de ingreso mensual", f: .8 },
      { t: "Ingreso mensual duplicado", f: 1 },
    ],
  },
  negocio: {
    label: "Negocio / proyecto propio", em: "🚀", tipo: "negocio",
    act: { titulo: "Construir mi negocio · trabajo enfocado", dur: 120, dias: [1, 2, 3, 4, 5] },
    metaNombre: "Lanzar y hacer crecer mi negocio",
    metrica: "Producto en el mercado con clientes que pagan",
    accion: "Un bloque diario para construir el negocio, no solo pensarlo.",
    porque: "Un negocio se construye a diario en pequeños pasos, no en el fin de semana perfecto que nunca llega.",
    horizonDef: "1a", hitos: [
      { t: "Idea validada con 5 personas reales", f: .1 },
      { t: "Primera versión lista para mostrar", f: .3 },
      { t: "Primer cliente que paga", f: .55 },
      { t: "10 clientes / ingresos recurrentes", f: .8 },
      { t: "Negocio en marcha y creciendo", f: 1 },
    ],
  },
  estudio: {
    label: "Estudiar / aprender algo", em: "📚", tipo: "estudio",
    act: { titulo: "Estudio enfocado", dur: 60, dias: [1, 2, 3, 4, 5] },
    metaNombre: "Dominar una nueva habilidad",
    metrica: "Terminar el curso/plan de estudio y aplicarlo",
    accion: "Una hora de estudio real al día, sin distracciones.",
    porque: "Aprender de verdad es constancia diaria, no maratones antes del examen.",
    horizonDef: "6a", hitos: [
      { t: "Elegir el plan y los recursos", f: .08 },
      { t: "25% del temario cubierto", f: .3 },
      { t: "La mitad, con práctica real", f: .55 },
      { t: "Temario terminado", f: .82 },
      { t: "Habilidad dominada y aplicada", f: 1 },
    ],
  },
  ahorro: {
    label: "Ahorrar e invertir", em: "🏦", tipo: "ahorro",
    act: null, // solo aporta el sábado (se agrega aparte)
    metaNombre: "Ahorrar e invertir 30% de mis ingresos",
    metrica: "30% de cada ingreso → inversión, cada semana",
    accion: "Aportación semanal del sábado, sin excepción.",
    porque: "Primero se le paga al futuro. El hábito de aportar es lo que enciende el interés compuesto.",
    horizonDef: "6a", calc: true, hitos: [
      { t: "Cuenta de inversión abierta y automatizada", f: .08 },
      { t: "8 semanas seguidas aportando", f: .3 },
      { t: "Fondo de emergencia completo", f: .6 },
      { t: "26 semanas de racha de aportación", f: 1 },
    ],
  },
  millonario: {
    label: "Libertad financiera (patrimonio)", em: "🪙", tipo: "dinero",
    act: null,
    metaNombre: "Patrimonio de $1,000,000 USD",
    metrica: "$1,000,000 USD de patrimonio neto",
    accion: "Ingresos crecientes + tasa de ahorro alta + interés compuesto + tiempo.",
    porque: "Libertad total. La fórmula no es un secreto: es constancia durante años.",
    horizonDef: "10a", calc: true, hitos: [
      { t: "Primeros $10k invertidos", f: .1 },
      { t: "$50k · la bola de nieve rueda", f: .25 },
      { t: "$100k · el primer 10% es el más difícil", f: .45 },
      { t: "$250k", f: .65 },
      { t: "$500k · la mitad del camino", f: .82 },
      { t: "$1,000,000", f: 1 },
    ],
  },
  viajar: {
    label: "Viajar", em: "✈️", tipo: "vida",
    act: null,
    metaNombre: "Viajar · 1 destino al año",
    metrica: "1 viaje al año, pagado en efectivo",
    accion: "El fondo de viaje se alimenta con la aportación semanal.",
    porque: "La riqueza también se cobra en experiencias, sin deuda.",
    horizonDef: "1a", hitos: [
      { t: "Elegir destino y presupuesto", f: .12 },
      { t: "50% del fondo reunido", f: .45 },
      { t: "Boletos comprados", f: .8 },
      { t: "El viaje", f: 1 },
    ],
  },
  bienestar: {
    label: "Bienestar mental / calma", em: "🧘", tipo: "bienestar",
    act: { titulo: "Bienestar · meditar, respirar, leer", dur: 20, dias: [0, 1, 2, 3, 4, 5, 6] },
    metaNombre: "Una mente más tranquila y clara",
    metrica: "Práctica diaria de calma (meditar / journaling / lectura)",
    accion: "10-20 min diarios para bajar el ruido mental.",
    porque: "La claridad mental multiplica todo lo demás. Se entrena como un músculo.",
    horizonDef: "3m", hitos: [
      { t: "7 días seguidos de práctica", f: .1 },
      { t: "Se vuelve parte del día", f: .4 },
      { t: "Noto menos ansiedad y más foco", f: .7 },
      { t: "Hábito consolidado", f: 1 },
    ],
  },
  relaciones: {
    label: "Familia y relaciones", em: "❤️", tipo: "vida",
    act: { titulo: "Tiempo de calidad · familia / seres queridos", dur: 60, dias: [0, 6] },
    metaNombre: "Estar más presente con quien quiero",
    metrica: "Tiempo de calidad protegido cada semana",
    accion: "Un bloque semanal sin pantallas con la familia.",
    porque: "El éxito sin la gente que quieres se siente vacío. Se agenda, si no, no pasa.",
    horizonDef: "3m", hitos: [
      { t: "Primer bloque protegido y cumplido", f: .15 },
      { t: "4 semanas seguidas de tiempo de calidad", f: .5 },
      { t: "Es parte fija de la semana", f: 1 },
    ],
  },
  productividad: {
    label: "Ser más productivo / hábitos", em: "✅", tipo: "productividad",
    act: { titulo: "Trabajo profundo · lo más importante primero", dur: 90, dias: [1, 2, 3, 4, 5] },
    metaNombre: "Dominar mis días y mis hábitos",
    metrica: "Ejecutar mi plan del día ≥ 85% de las veces",
    accion: "Empezar por lo más importante, antes que lo urgente.",
    porque: "La productividad no es hacer más cosas, es hacer las que importan, todos los días.",
    horizonDef: "3m", hitos: [
      { t: "1 semana con ≥70% de ejecución", f: .12 },
      { t: "Rutina de mañana consolidada", f: .4 },
      { t: "4 semanas seguidas ≥80%", f: .7 },
      { t: "Días bajo control · ≥85% sostenido", f: 1 },
    ],
  },
};
const AREA_ORDER = ["salud", "trading", "dinero", "negocio", "estudio", "productividad", "bienestar", "ahorro", "millonario", "viajar", "relaciones"];
const HORIZONTES = { "3m": { d: 90, l: "3 meses" }, "6m": { d: 183, l: "6 meses" }, "6a": { d: 183, l: "6 meses" }, "1a": { d: 365, l: "1 año" }, "5a": { d: 1825, l: "5 años" }, "10a": { d: 3653, l: "10 años" } };
const OBSTACULOS = ["Procrastinación", "Falta de tiempo", "Falta de constancia", "Distracciones", "No sé por dónde empezar", "Me desmotivo rápido"];

/* ============================================================
   GENERADORES  (encuesta → metas + plan semanal)
   ============================================================ */
function generarMetas(enc) {
  const metas = [];
  enc.areas.forEach((a) => {
    const c = AREAS[a]; if (!c) return;
    const esPrincipal = a === enc.principal;
    const hz = HORIZONTES[esPrincipal ? enc.horizonte : c.horizonDef] || HORIZONTES["6m"];
    const inicio = hoyISO();
    const fecha = addDias(inicio, hz.d);
    const hitos = c.hitos.map((h) => ({ t: h.t, f: addDias(inicio, Math.round(h.f * hz.d)), done: false }));
    metas.push({
      id: a, nombre: c.metaNombre, foco: false, inicio, fecha,
      porque: c.porque, metrica: c.metrica, accion: c.accion,
      milestones: hitos, calc: !!c.calc,
    });
  });
  // foco: la principal + hasta 3 en total (12WY)
  const principal = metas.find((m) => m.id === enc.principal);
  if (principal) principal.foco = true;
  let f = metas.filter((m) => m.foco).length;
  for (const m of metas) { if (f >= 3) break; if (!m.foco) { m.foco = true; f++; } }
  return metas;
}

function generarPlanSemanal(enc) {
  const plan = {};
  for (let dow = 0; dow <= 6; dow++) plan[dow] = planDia(enc, dow);
  return plan;
}

function planDia(enc, dow) {
  const wake = toMin(enc.despertar || "06:30");
  const sleep = toMin(enc.dormir || "22:30");
  const factor = enc.intensidad === "suave" ? 0.7 : enc.intensidad === "intenso" ? 1.25 : 1;
  const weekday = dow >= 1 && dow <= 5;
  const B = [];
  let t = wake;
  const push = (dur, slug, titulo, meta, tipo) => {
    dur = Math.round(dur / 5) * 5;
    if (t + dur > sleep - 30) return false;
    B.push({ ini: toHHMM(t), fin: toHHMM(t + dur), slug, titulo, meta, tipo });
    t += dur; return true;
  };

  push(20, "ritual-am", "Ritual de mañana · agua, respirar, intención", null, "ritual");

  // actividades del día según áreas
  const acts = [];
  for (const a of AREA_ORDER) {
    if (!enc.areas.includes(a)) continue;
    const c = AREAS[a];
    if (!c.act) continue;
    if (c.act.dias.includes(dow)) acts.push({ a, c });
  }

  let breakfast = false, lunch = false;
  for (const { a, c } of acts) {
    const dur = c.act.dur * factor;
    push(dur, a, c.act.titulo, a, c.tipo);
    if (!breakfast && weekday && t < toMin("11:00")) { push(25, "desayuno", "Desayuno", null, "vida"); breakfast = true; }
    if (!lunch && t >= toMin("12:30") && t < toMin("15:00")) { push(60, "comida", "Comida + descanso", null, "vida"); lunch = true; }
  }

  // especiales de fin de semana / ahorro
  if (dow === 6) push(30, "review", "Revisión semanal · scorecard", null, "ritual");
  if (dow === 0) push(40, "plan-semana", "Planeación de la semana · elegir focos", null, "ritual");
  if ((enc.areas.includes("ahorro") || enc.areas.includes("millonario") || enc.areas.includes("viajar")) && dow === 6)
    push(20, "aportacion", "Aportación semanal · inversión + fondo", "ahorro", "dinero");

  // ritual de cierre
  const cierreIni = Math.max(t + 5, sleep - 30);
  if (cierreIni < sleep) B.push({ ini: toHHMM(cierreIni), fin: toHHMM(sleep - 5), slug: "ritual-pm", titulo: "Ritual de cierre · revisar el día, planear mañana", meta: null, tipo: "ritual" });
  return B;
}

/* ============================================================
   ESTADO MULTI-USUARIO
   ============================================================ */
const ROOT_KEY = "ga_root";
let root = loadRoot();
root.circulos = root.circulos || [];
Object.values(root.users || {}).forEach((u) => { u.nudges = u.nudges || []; });
let S = null;   // estado del usuario activo

function loadRoot() {
  try {
    const raw = localStorage.getItem(ROOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupto */ }
  // migración desde la versión single-user (ga_v1)
  const legacy = migrarLegacy();
  return legacy || { activeId: null, users: {} };
}
function saveRoot() { localStorage.setItem(ROOT_KEY, JSON.stringify(root)); }
function save() { if (S && S._id) { root.users[S._id] = S; saveRoot(); } }

function migrarLegacy() {
  try {
    const raw = localStorage.getItem("ga_v1");
    if (!raw) return null;
    const old = JSON.parse(raw);
    const id = uid();
    old._id = id;
    old.nombre = (old.perfil && old.perfil.nombre) || "André";
    old.pin = ""; old.esDemo = true;
    old.onboarded = true;
    old.plan = planFromLegacy(); // plan hecho a mano de André
    old.encuesta = { areas: ["salud", "trading", "millonario", "ahorro", "viajar"], principal: "trading", horizonte: "1a", intensidad: "intenso", obstaculo: "Falta de constancia", edad: "", ciudad: old.perfil.ciudad || "Morelia" };
    return { activeId: null, users: { [id]: old } };
  } catch (e) { return null; }
}

/* plan hecho a mano de André (se congela como su plan personal) */
function planFromLegacy() {
  const TRI = { 1: "Natación · técnica 4×200 m", 2: "Bici · 45 min", 3: "Carrera · intervalos 6×400 m", 4: "Natación continua + fuerza", 5: "Bici · 60 min + transiciones" };
  const plan = {};
  for (let dow = 0; dow <= 6; dow++) {
    const B = []; const add = (ini, fin, slug, titulo, meta, tipo) => B.push({ ini, fin, slug, titulo, meta, tipo });
    if (dow >= 1 && dow <= 5) {
      add("05:30", "06:00", "ritual-am", "Ritual de mañana · agua, movilidad, intención", null, "ritual");
      add("06:00", "07:15", "salud", "Entreno · " + TRI[dow], "salud", "salud");
      add("07:15", "07:30", "premarket", "Preparación de mercado · niveles y plan", "trading", "trading");
      add("07:30", "10:00", "trading", "Sesión de trading · apertura NY", "trading", "trading");
      add("10:00", "10:30", "journal", "Journal honesto + revisión de la sesión", "trading", "trading");
      add("10:30", "11:00", "desayuno", "Desayuno fuerte", null, "vida");
      add("11:00", "13:30", "millonario", "Deep work · construir ingresos", "millonario", "dinero");
      add("13:30", "14:30", "comida", "Comida + descanso", null, "vida");
      add("14:30", "16:30", "dinero", "Deep work · clientes y ventas", "millonario", "dinero");
      add("16:30", "17:00", "sol", "Caminata / sol / desconexión", null, "vida");
      add("17:00", "18:00", "estudio", "Estudio · mercados y skills", "millonario", "estudio");
      if (dow === 5) add("18:00", "18:30", "ahorro", "Revisión de ahorro e inversión", "ahorro", "dinero");
      add("21:30", "22:00", "ritual-pm", "Ritual de cierre · revisar el día, planear mañana", null, "ritual");
    } else if (dow === 6) {
      add("06:30", "08:30", "salud", "Ladrillo largo · bici + carrera", "salud", "salud");
      add("09:00", "10:00", "review", "Revisión semanal de metas · scorecard", null, "ritual");
      add("10:00", "12:00", "millonario", "Deep work · proyecto principal", "millonario", "dinero");
      add("12:00", "12:30", "aportacion", "Aportación semanal · inversión + fondo de viaje", "ahorro", "dinero");
      add("21:30", "22:00", "ritual-pm", "Ritual de cierre", null, "ritual");
    } else {
      add("08:00", "09:00", "salud", "Descanso activo · trote suave o nado", "salud", "salud");
      add("18:00", "18:45", "plan-semana", "Planeación de la semana · elegir 3 focos", null, "ritual");
      add("21:30", "22:00", "ritual-pm", "Ritual de cierre", null, "ritual");
    }
    plan[dow] = B;
  }
  return plan;
}

/* usuario nuevo en blanco (antes de encuesta) */
function nuevoUsuario(nombre, pin) {
  const id = uid();
  return {
    _id: id, nombre, pin: pin || "", onboarded: false, creado: hoyISO(), nudges: [],
    perfil: { nombre, ciudad: "", despertar: "06:30", dormir: "22:30", carta: "", apiKey: "" },
    encuesta: null, metas: [], plan: {}, checks: {}, overrides: {}, chat: [],
    calc: { actual: 1000, mensual: 500, retorno: 8 },
  };
}

/* ---------- plan / checks (por usuario, para la carrera social) ---------- */
function bloquesDeU(u, dateISO) {
  if (u.overrides && u.overrides[dateISO]) return u.overrides[dateISO];
  const dow = parseISO(dateISO).getDay();
  return (u.plan && u.plan[dow]) || [];
}
function isCheckedU(u, dateISO, slug) { return !!(u.checks[dateISO] && u.checks[dateISO][slug]); }
function dayScoreU(u, dateISO) {
  const bloques = bloquesDeU(u, dateISO); if (!bloques.length) return null;
  const done = bloques.filter((b) => isCheckedU(u, dateISO, b.slug)).length;
  return Math.round((done / bloques.length) * 100);
}
function rachaU(u) {
  let count = 0, freezes = 0;
  const d = new Date();
  if ((dayScoreU(u, hoyISO()) || 0) < 60) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const key = iso(d);
    if (key < u.creado) break;
    const sc = dayScoreU(u, key) || 0;
    if (sc >= 60) count++;
    else if (freezes < 1 + Math.floor(count / 7)) freezes++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return { dias: count, seguros: freezes };
}
function weekScoreU(u) {
  const hoy = new Date(); const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  let done = 0, total = 0;
  for (let d = new Date(lunes); d <= hoy; d.setDate(d.getDate() + 1)) {
    const key = iso(d); const bloques = bloquesDeU(u, key);
    total += bloques.length; done += bloques.filter((b) => isCheckedU(u, key, b.slug)).length;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

/* atajos para el usuario activo */
const bloquesDe = (dateISO) => bloquesDeU(S, dateISO);
const isChecked = (dateISO, slug) => isCheckedU(S, dateISO, slug);
const dayScore = (dateISO) => dayScoreU(S, dateISO);
const racha = () => rachaU(S);
const weekScore = () => weekScoreU(S);
function toggleCheck(dateISO, slug) { S.checks[dateISO] = S.checks[dateISO] || {}; S.checks[dateISO][slug] = !S.checks[dateISO][slug]; save(); }
function paceMeta(m) {
  const total = m.milestones.length;
  const hechos = m.milestones.filter((x) => x.done).length;
  const transcurrido = Math.max(0, diasEntre(m.inicio, hoyISO()));
  const duracion = Math.max(1, diasEntre(m.inicio, m.fecha));
  const pctTiempo = Math.min(100, Math.round((transcurrido / duracion) * 100));
  const pctHecho = Math.round((hechos / total) * 100);
  const proximo = m.milestones.find((x) => !x.done);
  const atrasado = proximo && proximo.f < hoyISO();
  const dias = diasEntre(hoyISO(), m.fecha);
  let estado, cls;
  if (atrasado) { estado = "ATRASADO · hito vencido"; cls = "goal-miss"; }
  else if (pctHecho >= pctTiempo) { estado = "A RITMO"; cls = "goal-hit"; }
  else { estado = "POR DEBAJO DEL RITMO"; cls = "goal-miss"; }
  return { total, hechos, pctTiempo, pctHecho, proximo, atrasado, dias, estado, cls };
}

/* ============================================================
   GATE — landing / login / crear / encuesta
   ============================================================ */
function showGateScreen(id) {
  $("#gate").classList.add("on");
  $("#app").classList.remove("on");
  $$(".gate-screen").forEach((s) => s.classList.toggle("on", s.id === id));
  $("#top-login").style.display = (id === "gate-landing") ? "" : "none";
  window.scrollTo(0, 0);
}
function enterApp() {
  $("#gate").classList.remove("on");
  $("#app").classList.add("on");
  renderUserChip();
  vista = "hoy";
  $$(".nav-btn").forEach((x) => x.classList.toggle("on", x.dataset.view === "hoy"));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === "view-hoy"));
  render();
  renderChat();
}

/* landing */
$("#cta-crear").addEventListener("click", () => showGateScreen("gate-create"));
$("#cta-crear-2").addEventListener("click", () => showGateScreen("gate-create"));
$("#cta-entrar").addEventListener("click", () => openLogin());
$("#top-login").addEventListener("click", () => openLogin());
$("#cta-demo").addEventListener("click", () => {
  // asegurar que exista el demo André
  let demo = Object.values(root.users).find((u) => u.esDemo && u.onboarded) || Object.values(root.users).find((u) => u.onboarded);
  if (!demo) {
    const mig = migrarLegacy();
    if (mig) { Object.assign(root.users, mig.users); demo = Object.values(mig.users)[0]; saveRoot(); }
  }
  if (demo) { root.activeId = demo._id; S = root.users[demo._id]; saveRoot(); enterApp(); }
  else { showGateScreen("gate-create"); }
});

/* login */
function openLogin() {
  const users = Object.values(root.users);
  if (!users.length) { showGateScreen("gate-create"); return; }
  const grid = $("#login-grid");
  grid.innerHTML = users.map((u) => `
    <button class="user-tile" data-id="${u._id}">
      <div class="av">${initial(u.nombre)}</div>
      <div class="nm">${u.nombre}</div>
    </button>`).join("") +
    `<button class="user-tile add" id="tile-add"><div class="av">+</div><div class="nm">Nuevo</div></button>`;
  $("#login-pin").style.display = "none";
  $("#login-err").textContent = "";
  showGateScreen("gate-login");
  $$("#login-grid .user-tile[data-id]").forEach((t) => t.addEventListener("click", () => intentarEntrar(t.dataset.id)));
  $("#tile-add").addEventListener("click", () => showGateScreen("gate-create"));
}
let pendingUser = null;
function intentarEntrar(id) {
  const u = root.users[id];
  if (u.pin) {
    pendingUser = id;
    $("#login-pin").style.display = "flex";
    $("#pin-in").value = ""; $("#pin-in").focus();
    $("#login-err").textContent = "Ingresa tu PIN.";
  } else { hacerLogin(id); }
}
function hacerLogin(id) {
  root.activeId = id; S = root.users[id]; saveRoot();
  if (!S.onboarded) startOnboarding();
  else enterApp();
}
$("#pin-go").addEventListener("click", () => {
  const u = root.users[pendingUser];
  if ($("#pin-in").value === u.pin) hacerLogin(pendingUser);
  else $("#login-err").textContent = "PIN incorrecto.";
});
$("#pin-in").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#pin-go").click(); });
$("#login-back").addEventListener("click", () => showGateScreen("gate-landing"));

/* crear usuario */
$("#create-back").addEventListener("click", () => showGateScreen(Object.keys(root.users).length ? "gate-login" : "gate-landing"));
$("#create-go").addEventListener("click", () => {
  const nombre = $("#new-name").value.trim();
  const pin = $("#new-pin").value.trim();
  if (!nombre) { $("#create-err").textContent = "Escribe tu nombre."; return; }
  if (pin && !/^\d{4}$/.test(pin)) { $("#create-err").textContent = "El PIN debe ser de 4 dígitos."; return; }
  const u = nuevoUsuario(nombre, pin);
  root.users[u._id] = u; root.activeId = u._id; S = u; saveRoot();
  startOnboarding();
});

/* ============================================================
   ENCUESTA (wizard)
   ============================================================ */
let draft = null;
let paso = 0;
const PASOS = ["intro", "datos", "horarios", "areas", "principal", "intensidad", "obstaculo", "motivacion", "resumen"];

function startOnboarding() {
  draft = S.encuesta && S.encuesta.areas ? JSON.parse(JSON.stringify(S.encuesta)) : {
    areas: [], principal: null, horizonte: "6m", intensidad: "equilibrado",
    obstaculo: null, motivacion: S.perfil.carta || "",
    edad: "", ciudad: S.perfil.ciudad || "", despertar: S.perfil.despertar || "06:30", dormir: S.perfil.dormir || "22:30",
  };
  paso = 0;
  showGateScreen("gate-onboard");
  renderPaso();
}

function renderPaso() {
  const p = PASOS[paso];
  const box = $("#onb-step");
  $("#onb-progress i").style.width = Math.round((paso / (PASOS.length - 1)) * 100) + "%";
  $("#onb-count").textContent = `${paso + 1} / ${PASOS.length}`;
  $("#onb-back").style.visibility = paso === 0 ? "hidden" : "visible";
  $("#onb-next").textContent = p === "resumen" ? "Crear mi plan ✓" : "Siguiente";

  if (p === "intro") {
    box.innerHTML = `<div class="q">Hola, ${S.nombre}</div>
      <div class="qs">Vamos a armar tu plan. Son 7 preguntas cortas — con tus respuestas, el asistente te entiende y te arma el día a tu medida.</div>
      <div class="onb-body" style="display:grid;place-items:center;color:var(--dim);font-size:14px;text-align:center;">
        <div>Todo se guarda solo en este dispositivo.<br>Puedes rehacer la encuesta cuando quieras desde Perfil.</div></div>`;
  }
  else if (p === "datos") {
    box.innerHTML = `<div class="q">Cuéntanos de ti</div><div class="qs">Opcional, pero ayuda a personalizar.</div>
      <div class="onb-body">
        <div class="field"><span class="k">Edad</span><input id="d-edad" type="number" value="${draft.edad}" placeholder="Ej. 28"></div>
        <div class="field"><span class="k">Ciudad</span><input id="d-ciudad" type="text" value="${draft.ciudad}" placeholder="Ej. Morelia"></div>
      </div>`;
  }
  else if (p === "horarios") {
    box.innerHTML = `<div class="q">¿A qué hora vives tu día?</div><div class="qs">Con esto armamos tus bloques entre que despiertas y duermes.</div>
      <div class="onb-body">
        <div class="field"><span class="k">Despierto a las</span><input id="d-wake" type="time" value="${draft.despertar}"></div>
        <div class="field"><span class="k">Me duermo a las</span><input id="d-sleep" type="time" value="${draft.dormir}"></div>
      </div>`;
  }
  else if (p === "areas") {
    box.innerHTML = `<div class="q">¿Qué quieres mejorar?</div><div class="qs">Elige una o varias. Cada área se vuelve una meta con su plan.</div>
      <div class="onb-body"><div class="chip-grid" id="areas-grid">
        ${AREA_ORDER.map((a) => `<button class="opt-chip ${draft.areas.includes(a) ? "on" : ""}" data-a="${a}">${AREAS[a].label}</button>`).join("")}
      </div></div>`;
    $$("#areas-grid .opt-chip").forEach((c) => c.addEventListener("click", () => {
      const a = c.dataset.a; const i = draft.areas.indexOf(a);
      if (i >= 0) draft.areas.splice(i, 1); else draft.areas.push(a);
      if (draft.principal && !draft.areas.includes(draft.principal)) draft.principal = null;
      c.classList.toggle("on");
    }));
  }
  else if (p === "principal") {
    if (!draft.areas.length) { box.innerHTML = `<div class="q">Primero elige un área</div><div class="qs">Regresa un paso y marca al menos una.</div>`; }
    else {
      if (!draft.principal) draft.principal = draft.areas[0];
      box.innerHTML = `<div class="q">Tu meta #1</div><div class="qs">La que más te importa este ciclo. Le pondremos foco especial (máx. 3 focos).</div>
        <div class="onb-body">
          <div class="card-choose" id="prin-grid">
            ${draft.areas.map((a) => `<button class="big-opt ${a === draft.principal ? "on" : ""}" data-a="${a}"><span class="em">${AREAS[a].em}</span><div><div class="t1">${AREAS[a].metaNombre}</div><div class="t2">${AREAS[a].metrica}</div></div></button>`).join("")}
          </div>
          <div style="margin-top:18px;"><span class="k" style="display:block;margin-bottom:8px;">¿Para cuándo?</span>
            <div class="seg" id="hz-seg">
              ${["3m", "6m", "1a", "5a", "10a"].map((h) => `<button data-h="${h}" class="${draft.horizonte === h ? "on" : ""}">${HORIZONTES[h].l}</button>`).join("")}
            </div></div>
        </div>`;
      $$("#prin-grid .big-opt").forEach((b) => b.addEventListener("click", () => { draft.principal = b.dataset.a; renderPaso(); }));
      $$("#hz-seg button").forEach((b) => b.addEventListener("click", () => { draft.horizonte = b.dataset.h; renderPaso(); }));
    }
  }
  else if (p === "intensidad") {
    const opts = [
      { v: "suave", t1: "Suave", t2: "Pocos bloques, sin presión. Para empezar sin quemarme." },
      { v: "equilibrado", t1: "Equilibrado", t2: "El punto medio. Constante y sostenible." },
      { v: "intenso", t1: "Intenso", t2: "Días llenos, alta exigencia. Voy con todo." },
    ];
    box.innerHTML = `<div class="q">¿Qué tan intenso?</div><div class="qs">Define cuánto cargamos tu día.</div>
      <div class="onb-body"><div class="card-choose" id="int-grid">
        ${opts.map((o) => `<button class="big-opt ${draft.intensidad === o.v ? "on" : ""}" data-v="${o.v}"><div><div class="t1">${o.t1}</div><div class="t2">${o.t2}</div></div></button>`).join("")}
      </div></div>`;
    $$("#int-grid .big-opt").forEach((b) => b.addEventListener("click", () => { draft.intensidad = b.dataset.v; renderPaso(); }));
  }
  else if (p === "obstaculo") {
    box.innerHTML = `<div class="q">¿Qué te suele frenar?</div><div class="qs">El asistente lo tomará en cuenta para ayudarte donde más lo necesitas.</div>
      <div class="onb-body"><div class="chip-grid" id="obs-grid">
        ${OBSTACULOS.map((o) => `<button class="opt-chip ${draft.obstaculo === o ? "on" : ""}" data-o="${o}">${o}</button>`).join("")}
      </div></div>`;
    $$("#obs-grid .opt-chip").forEach((c) => c.addEventListener("click", () => { draft.obstaculo = c.dataset.o; renderPaso(); }));
  }
  else if (p === "motivacion") {
    box.innerHTML = `<div class="q">Carta a tu futuro yo</div><div class="qs">¿Por qué estas metas importan? El asistente te la recordará cuando flaquees.</div>
      <div class="onb-body"><textarea id="d-mot" rows="5" placeholder="Escríbele a tu yo del futuro…">${draft.motivacion}</textarea></div>`;
  }
  else if (p === "resumen") {
    const areasTxt = draft.areas.map((a) => AREAS[a].label).join(", ") || "—";
    box.innerHTML = `<div class="q">Tu plan está listo</div><div class="qs">Revisa y crea tu plan. Puedes cambiar todo después.</div>
      <div class="onb-body"><div class="onb-summary">
        <div class="row"><span class="lab">Perfil</span><span class="val">${S.nombre}${draft.edad ? " · " + draft.edad + " años" : ""}${draft.ciudad ? " · " + draft.ciudad : ""}</span></div>
        <div class="row"><span class="lab">Horario</span><span class="val">${draft.despertar} — ${draft.dormir}</span></div>
        <div class="row"><span class="lab">Áreas</span><span class="val">${areasTxt}</span></div>
        <div class="row"><span class="lab">Meta #1</span><span class="val">${draft.principal ? AREAS[draft.principal].metaNombre + " · " + HORIZONTES[draft.horizonte].l : "—"}</span></div>
        <div class="row"><span class="lab">Intensidad</span><span class="val" style="text-transform:capitalize">${draft.intensidad}</span></div>
        <div class="row"><span class="lab">Mayor obstáculo</span><span class="val">${draft.obstaculo || "—"}</span></div>
      </div></div>`;
  }
}

function guardarPaso() {
  const p = PASOS[paso];
  if (p === "datos") { draft.edad = $("#d-edad").value.trim(); draft.ciudad = $("#d-ciudad").value.trim(); }
  if (p === "horarios") { draft.despertar = $("#d-wake").value || "06:30"; draft.dormir = $("#d-sleep").value || "22:30"; }
  if (p === "motivacion") { draft.motivacion = $("#d-mot").value.trim(); }
}
function validarPaso() {
  const p = PASOS[paso];
  if (p === "areas" && !draft.areas.length) { alert("Elige al menos un área para mejorar."); return false; }
  if (p === "principal" && !draft.principal) { alert("Elige tu meta #1."); return false; }
  return true;
}
$("#onb-next").addEventListener("click", () => {
  guardarPaso();
  if (!validarPaso()) return;
  if (PASOS[paso] === "resumen") { finalizarOnboarding(); return; }
  paso++; renderPaso();
});
$("#onb-back").addEventListener("click", () => { guardarPaso(); if (paso > 0) { paso--; renderPaso(); } });

function finalizarOnboarding() {
  S.encuesta = draft;
  S.perfil.ciudad = draft.ciudad;
  S.perfil.despertar = draft.despertar;
  S.perfil.dormir = draft.dormir;
  S.perfil.carta = draft.motivacion;
  S.metas = generarMetas(draft);
  S.plan = generarPlanSemanal(draft);
  S.onboarded = true;
  S.chat = [];
  save();
  enterApp();
}

/* ============================================================
   USER CHIP + MENÚ
   ============================================================ */
function renderUserChip() {
  $("#chip-av").textContent = initial(S.nombre);
  $("#chip-name").textContent = S.nombre;
}
$("#user-chip").addEventListener("click", () => {
  const users = Object.values(root.users);
  $("#user-pop").innerHTML =
    users.map((u) => `<button class="mrow" data-id="${u._id}"><span class="av">${initial(u.nombre)}</span>${u.nombre}${u._id === S._id ? " ✓" : ""}</button>`).join("") +
    `<hr><button class="mrow plain" id="mrow-add"><span class="av">+</span>Nuevo perfil</button>` +
    `<button class="mrow plain" id="mrow-logout"><span class="av">›</span>Cerrar sesión</button>`;
  $("#user-menu").classList.add("on");
  $$("#user-pop .mrow[data-id]").forEach((r) => r.addEventListener("click", () => {
    $("#user-menu").classList.remove("on");
    if (r.dataset.id !== S._id) { root.activeId = r.dataset.id; S = root.users[r.dataset.id]; saveRoot(); S.onboarded ? enterApp() : startOnboarding(); }
  }));
  $("#mrow-add").addEventListener("click", () => { $("#user-menu").classList.remove("on"); showGateScreen("gate-create"); $("#new-name").value = ""; $("#new-pin").value = ""; $("#create-err").textContent = ""; });
  $("#mrow-logout").addEventListener("click", () => { $("#user-menu").classList.remove("on"); root.activeId = null; saveRoot(); showGateScreen("gate-landing"); });
});
$("#user-menu .backdrop").addEventListener("click", () => $("#user-menu").classList.remove("on"));

/* ============================================================
   NAV + RELOJ
   ============================================================ */
let vista = "hoy";
$$(".nav-btn").forEach((b) => b.addEventListener("click", () => {
  vista = b.dataset.view;
  $$(".nav-btn").forEach((x) => x.classList.toggle("on", x === b));
  $$(".view").forEach((v) => v.classList.toggle("on", v.id === "view-" + vista));
  render();
}));

let lastMin = -1;
function tick() {
  const d = new Date();
  const hh = pad(d.getHours()), mm = pad(d.getMinutes()), ss = pad(d.getSeconds());
  if ($("#side-time")) { $("#side-time").textContent = `${hh}:${mm}`; $("#side-date").textContent = `${DOWS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; }
  if ($("#app").classList.contains("on")) {
    $("#big-clock").innerHTML = `${hh}:${mm}<span class="sec">:${ss}</span>`;
    if (d.getMinutes() !== lastMin) { lastMin = d.getMinutes(); if (vista === "hoy") renderHoy(); }
  }
}
setInterval(tick, 1000);

/* ============================================================
   RENDER — HOY
   ============================================================ */
function saludoTexto() {
  const h = new Date().getHours(); const n = S.nombre;
  const base = h < 12 ? `Buenos días, ${n}.` : h < 19 ? `Buenas tardes, ${n}.` : `Buenas noches, ${n}.`;
  const foco = S.metas.find((m) => m.foco);
  let extra = "";
  if (foco) { const p = paceMeta(foco); if (p.dias > 0) extra = ` Faltan <strong>${p.dias} días</strong> para: ${foco.nombre.toLowerCase()}.`; }
  return `${base} Hoy hay un plan: ejecutarlo es lo único que separa a tu versión actual de la mejor.${extra}`;
}
function bloqueActualYSiguiente() {
  const bloques = bloquesDe(hoyISO()); const n = nowMin();
  let actual = null, siguiente = null;
  for (const b of bloques) {
    if (toMin(b.ini) <= n && n < toMin(b.fin)) actual = b;
    else if (toMin(b.ini) > n && !siguiente) siguiente = b;
  }
  return { actual, siguiente, bloques };
}
function renderNudges() {
  const sinVer = (S.nudges || []).filter((n) => !n.visto);
  $("#nudges").innerHTML = sinVer.map((n, i) => `<div class="nudge">
    <span><span class="de">${n.de} te empujó:</span> <span class="txt">"${n.texto}"</span></span>
    <button data-n="${i}">OK</button>
  </div>`).join("");
  $$("#nudges .nudge button").forEach((b) => b.addEventListener("click", () => {
    sinVer[b.dataset.n].visto = true; save(); renderNudges();
  }));
}

function renderHoy() {
  const hoy = hoyISO();
  $("#hoy-fecha").textContent = fechaLarga(new Date());
  $("#hoy-saludo").innerHTML = saludoTexto();
  renderNudges();
  const sc = dayScore(hoy) || 0; const C = 2 * Math.PI * 48;
  $("#ring-fg").style.strokeDashoffset = String(C * (1 - sc / 100));
  $("#score-val").textContent = sc + "%";
  const r = racha();
  $("#streak-line").innerHTML = `Racha: <b>${r.dias} días</b>${r.seguros ? ` · ${r.seguros} seguro usado` : ""}`;

  const { actual, siguiente, bloques } = bloqueActualYSiguiente();
  const actualPend = actual && !isChecked(hoy, actual.slug) ? actual : null;
  const card = actualPend || siguiente;
  if (card) {
    $("#next-k").textContent = actualPend ? "En curso" : "Siguiente";
    $("#next-title").textContent = card.titulo;
    const meta = S.metas.find((m) => m.id === card.meta);
    $("#next-sub").textContent = meta ? "Alimenta: " + meta.nombre : "Mantenimiento del sistema";
    $("#next-when").textContent = `${card.ini} – ${card.fin}`;
  } else {
    $("#next-k").textContent = "Día completado";
    $("#next-title").textContent = bloques.length ? "No queda nada programado" : "Aún no tienes un plan";
    $("#next-sub").textContent = bloques.length ? "Cierra el día con el asistente y descansa." : "Rehaz tu encuesta desde Perfil.";
    $("#next-when").textContent = "—";
  }

  const n = nowMin();
  $("#timeline").innerHTML = bloques.map((b) => {
    const done = isChecked(hoy, b.slug);
    const esActual = toMin(b.ini) <= n && n < toMin(b.fin);
    const past = toMin(b.fin) <= n;
    const meta = S.metas.find((m) => m.id === b.meta);
    const cls = ["tl-block", done ? "done" : "", esActual ? "now" : "", past ? "past" : ""].join(" ");
    return `<div class="${cls}"><div class="hrs">${b.ini} – ${b.fin}</div>
      <div><div class="tt">${b.titulo}</div>${meta ? `<div class="meta-tag">→ ${meta.nombre}</div>` : ""}</div>
      <button class="chk ${done ? "done" : ""}" data-slug="${b.slug}" aria-label="marcar">${done ? "✓" : ""}</button></div>`;
  }).join("") || `<div style="color:var(--faint);font-size:14px;padding:16px 0;">No hay bloques para hoy. Ve a Perfil → Rehacer encuesta.</div>`;
  $$("#timeline .chk").forEach((c) => c.addEventListener("click", () => { toggleCheck(hoy, c.dataset.slug); renderHoy(); }));

  const ws = weekScore();
  $("#week-score").textContent = `${ws}% ejecutado`;
  $("#week-bar").style.width = ws + "%";
  $("#week-bar").style.background = ws >= 85 ? "var(--ok)" : "var(--accent)";
}
function replanearHoy() {
  const hoy = hoyISO(); const bloques = bloquesDe(hoy); const n = nowMin();
  const dormir = toMin(S.perfil.dormir || "22:30");
  let cursor = Math.ceil(n / 5) * 5;
  const nuevos = bloques.map((b) => {
    const done = isChecked(hoy, b.slug);
    if (done || toMin(b.fin) <= n) return b;
    const dur = toMin(b.fin) - toMin(b.ini);
    if (cursor + dur > dormir) return { ...b, skip: true };
    const nb = { ...b, ini: toHHMM(cursor), fin: toHHMM(cursor + dur) }; cursor += dur; return nb;
  }).filter((b) => !b.skip);
  S.overrides[hoy] = nuevos; save(); renderHoy(); return nuevos;
}
$("#btn-replan").addEventListener("click", replanearHoy);

/* ============================================================
   RENDER — SEMANA
   ============================================================ */
function renderSemana() {
  const hoyDow = new Date().getDay(); const orden = [1, 2, 3, 4, 5, 6, 0];
  $("#semana-grid").innerHTML = orden.map((dow) => {
    const bloques = (S.plan && S.plan[dow]) || [];
    return `<div class="sem-col ${dow === hoyDow ? "today" : ""}"><h4>${DOWS[dow]}</h4>
      ${bloques.map((b) => `<div class="sem-item"><span class="h">${b.ini}</span>${b.titulo}</div>`).join("") || `<div class="sem-item" style="color:var(--faint)">Descanso</div>`}
    </div>`;
  }).join("");
}

/* ============================================================
   RENDER — CALENDARIO
   ============================================================ */
let calRef = new Date(); let calSel = null;
$("#cal-prev").addEventListener("click", () => { calRef.setMonth(calRef.getMonth() - 1); renderCal(); });
$("#cal-next").addEventListener("click", () => { calRef.setMonth(calRef.getMonth() + 1); renderCal(); });
function renderCal() {
  const y = calRef.getFullYear(), m = calRef.getMonth();
  $("#cal-title").textContent = `${MESES[m]} ${y}`;
  const first = new Date(y, m, 1); const start = (first.getDay() + 6) % 7;
  const dias = new Date(y, m + 1, 0).getDate(); const hoy = hoyISO();
  let html = ["L", "M", "X", "J", "V", "S", "D"].map((d) => `<div class="cal-dow">${d}</div>`).join("");
  for (let i = 0; i < start; i++) html += `<div class="cal-day off"></div>`;
  for (let d = 1; d <= dias; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`; const bloques = bloquesDe(key);
    const tipos = [...new Set(bloques.map((b) => b.tipo))].filter((t) => t !== "vida");
    const dots = tipos.map((t) => `<span class="dot ${t}"></span>`).join("");
    let pct = "";
    if (key <= hoy && key >= S.creado) { const sc = dayScore(key) || 0; pct = `<div class="pct ${sc >= 85 ? "hi" : sc < 40 ? "lo" : ""}">${sc}%</div>`; }
    html += `<button class="cal-day ${key === hoy ? "today" : ""} ${key === calSel ? "sel" : ""}" data-d="${key}"><span class="n">${d}</span><div class="dots">${dots}</div>${pct}</button>`;
  }
  $("#cal-grid").innerHTML = html;
  $$("#cal-grid .cal-day[data-d]").forEach((el) => el.addEventListener("click", () => { calSel = el.dataset.d; renderCal(); renderCalDetail(calSel); }));
  if (calSel) renderCalDetail(calSel);
}
function renderCalDetail(key) {
  const bloques = bloquesDe(key); const det = $("#cal-detail"); det.classList.add("on");
  det.innerHTML = `<h3>${fechaLarga(parseISO(key))}</h3>` + (bloques.map((b) => {
    const done = isChecked(key, b.slug);
    return `<div class="row"><span class="h">${b.ini}–${b.fin}</span><span style="${done ? "color:var(--faint)" : ""}">${done ? "✓ " : ""}${b.titulo}</span></div>`;
  }).join("") || `<div style="color:var(--faint)">Día de descanso.</div>`);
}

/* ============================================================
   RENDER — METAS
   ============================================================ */
function renderMetas() {
  if (!S.metas.length) { $("#metas-list").innerHTML = `<div style="color:var(--dim)">Aún no tienes metas. Ve a Perfil → Rehacer encuesta.</div>`; return; }
  const focos = S.metas.filter((m) => m.foco); const resto = S.metas.filter((m) => !m.foco);
  const bloque = (m) => {
    const p = paceMeta(m);
    return `<div class="meta-card">
      <div class="top"><h3>${m.foco ? "◆ " : ""}${m.nombre}</h3><span class="cd">${p.dias > 0 ? p.dias + " días restantes" : "fecha alcanzada"}</span></div>
      <p class="why">${m.porque}</p>
      <div class="metric"><span>Métrica de éxito · </span>${m.metrica}</div>
      <div class="bar"><i style="width:${p.pctHecho}%; background:${p.cls === "goal-hit" ? "var(--ok)" : "var(--accent)"}"></i></div>
      <div class="bar-caption"><span>${p.hechos}/${p.total} hitos</span><span style="color:${p.cls === "goal-hit" ? "var(--ok)" : "var(--danger)"};font-weight:600">${p.estado}</span><span>${p.pctTiempo}% del tiempo</span></div>
      <div class="mst-list">${m.milestones.map((ms, i) => `<div class="mst ${ms.done ? "done" : ""}"><button class="chk ${ms.done ? "done" : ""}" data-meta="${m.id}" data-i="${i}">${ms.done ? "✓" : ""}</button><span class="when">${ms.f}</span><span class="txt">${ms.t}</span></div>`).join("")}</div>
      <div class="accion"><b>Acción diaria →</b> ${m.accion}</div>
      ${m.calc ? calcHTML() : ""}</div>`;
  };
  $("#metas-list").innerHTML =
    `<div class="k" style="margin-bottom:12px;">Foco del ciclo · máx. 3</div>` + focos.map(bloque).join("") +
    (resto.length ? `<div class="k" style="margin:24px 0 12px;">En segundo plano</div>` + resto.map(bloque).join("") : "");
  $$("#metas-list .mst .chk").forEach((c) => c.addEventListener("click", () => {
    const m = S.metas.find((x) => x.id === c.dataset.meta);
    m.milestones[c.dataset.i].done = !m.milestones[c.dataset.i].done; save(); renderMetas();
  }));
  bindCalc();
}
function calcHTML() {
  const c = S.calc;
  return `<div id="calc"><span class="k">Calculadora · interés compuesto</span>
    <div class="inputs" style="margin-top:12px;">
      <label><span class="k">Patrimonio actual (USD)</span><input id="c-actual" type="number" value="${c.actual}"></label>
      <label><span class="k">Aportación mensual (USD)</span><input id="c-mensual" type="number" value="${c.mensual}"></label>
      <label><span class="k">Retorno anual %</span><input id="c-retorno" type="number" value="${c.retorno}" step="0.5"></label>
    </div><div id="calc-out"></div></div>`;
}
function bindCalc() {
  const out = $("#calc-out"); if (!out) return;
  const metaCalc = S.metas.find((m) => m.calc);
  const objetivo = metaCalc && metaCalc.id === "ahorro" ? null : 1000000;
  const upd = () => {
    S.calc.actual = +$("#c-actual").value || 0; S.calc.mensual = +$("#c-mensual").value || 0; S.calc.retorno = +$("#c-retorno").value || 0; save();
    const meses = Math.max(1, Math.round(diasEntre(hoyISO(), metaCalc.fecha) / 30.44));
    const r = S.calc.retorno / 100 / 12;
    const fv = r > 0 ? S.calc.actual * Math.pow(1 + r, meses) + S.calc.mensual * ((Math.pow(1 + r, meses) - 1) / r) : S.calc.actual + S.calc.mensual * meses;
    if (objetivo) {
      const need = r > 0 ? (objetivo - S.calc.actual * Math.pow(1 + r, meses)) / ((Math.pow(1 + r, meses) - 1) / r) : (objetivo - S.calc.actual) / meses;
      const hit = fv >= objetivo;
      out.innerHTML = `Con este plan llegas a <b>${fmtMoney(fv)}</b> en ${Math.max(1, Math.round(meses / 12))} años · <span class="${hit ? "goal-hit" : "goal-miss"}">${hit ? "META CUMPLIDA ✓" : "te falta"}</span>` +
        (hit ? "" : `<br>Para ${fmtMoney(objetivo)} necesitas aportar <b>${fmtMoney(Math.max(0, need))}/mes</b> — la brecha se cierra subiendo ingresos.`);
    } else {
      out.innerHTML = `A este ritmo acumulas <b>${fmtMoney(fv)}</b> en ${Math.max(1, Math.round(meses / 12))} años de aportación constante. El hábito es lo que enciende el compuesto.`;
    }
  };
  ["c-actual", "c-mensual", "c-retorno"].forEach((id) => $("#" + id).addEventListener("input", upd));
  upd();
}

/* ============================================================
   SOCIAL — círculos y carrera
   ============================================================ */
const CIRC_TIPOS = ["Gym", "Familia", "Ahorro", "Estudio", "Trading", "Otro"];
const FRASES_PUSH = [
  "Te veo abajo en la carrera. ¿Así o más cómodo?",
  "Hoy no se negocia. Un bloque a la vez.",
  "Tu racha te está esperando. Muévete.",
  "La mejor versión de ti no se construye sola. Vamos.",
  "0 excusas. Nos vemos en la meta.",
];
let circSel = null;
let circFormOpen = false;
let draftCirc = null;

function misCirculos() { return root.circulos.filter((c) => c.miembros.includes(S._id)); }

function circProgress(c) {
  return c.miembros
    .map((id) => root.users[id]).filter(Boolean)
    .map((u) => {
      let pct, label;
      if (c.metrica === "racha") { const r = rachaU(u); pct = Math.min(100, Math.round((r.dias / 30) * 100)); label = r.dias + " días"; }
      else { pct = weekScoreU(u); label = pct + "%"; }
      return { u, pct, label };
    })
    .sort((a, b) => b.pct - a.pct);
}

function empujar(destId, btn) {
  const dest = root.users[destId]; if (!dest) return;
  const texto = FRASES_PUSH[Math.floor(Math.random() * FRASES_PUSH.length)];
  dest.nudges = dest.nudges || [];
  dest.nudges.push({ de: S.nombre, texto, fecha: hoyISO(), visto: false });
  saveRoot();
  if (btn) { btn.textContent = "Enviado"; btn.classList.add("sent"); btn.disabled = true; }
}

function renderSocial() {
  const circs = misCirculos();
  if (circSel && !circs.find((c) => c.id === circSel)) circSel = null;
  if (!circSel && circs.length) circSel = circs[0].id;

  // barra de círculos
  $("#circ-bar").innerHTML =
    circs.map((c) => `<button class="circ-chip ${c.id === circSel ? "on" : ""}" data-c="${c.id}">${c.nombre}<span class="n-mem">${c.miembros.length}</span></button>`).join("") +
    `<button class="circ-chip" id="circ-new">+ Nuevo círculo</button>`;
  $$("#circ-bar .circ-chip[data-c]").forEach((ch) => ch.addEventListener("click", () => { circSel = ch.dataset.c; circFormOpen = false; renderSocial(); }));
  $("#circ-new").addEventListener("click", () => {
    circFormOpen = true;
    draftCirc = { nombre: "", tipo: "Gym", metrica: "semana", miembros: [S._id] };
    renderSocial();
  });

  // formulario de creación
  const form = $("#circ-create");
  if (circFormOpen && draftCirc) {
    const users = Object.values(root.users);
    form.innerHTML = `<div class="circ-form">
      <div class="row"><span class="k">Nombre del círculo</span><input id="cf-nombre" type="text" placeholder="Ej. Gym de la casa" value="${draftCirc.nombre}"></div>
      <div class="row"><span class="k">Tipo</span><div class="chip-grid">
        ${CIRC_TIPOS.map((t) => `<button class="opt-chip ${draftCirc.tipo === t ? "on" : ""}" data-t="${t}">${t}</button>`).join("")}
      </div></div>
      <div class="row"><span class="k">La carrera se corre por</span><div class="seg" id="cf-met">
        <button data-m="semana" class="${draftCirc.metrica === "semana" ? "on" : ""}">Ejecución de la semana</button>
        <button data-m="racha" class="${draftCirc.metrica === "racha" ? "on" : ""}">Racha (meta: 30 días)</button>
      </div></div>
      <div class="row"><span class="k">Miembros (perfiles de este dispositivo)</span><div>
        ${users.map((u) => `<button class="mem-check ${draftCirc.miembros.includes(u._id) ? "on" : ""} ${u._id === S._id ? "self" : ""}" data-u="${u._id}"><span class="mini-av">${initial(u.nombre)}</span>${u.nombre}${u._id === S._id ? " (tú)" : ""}</button>`).join("")}
      </div></div>
      <div class="btn-row" style="margin-top:6px;">
        <button class="btn primary" id="cf-crear">Crear círculo</button>
        <button class="btn ghost" id="cf-cancel">Cancelar</button>
      </div>
    </div>`;
    $("#cf-nombre").addEventListener("input", (e) => { draftCirc.nombre = e.target.value; });
    $$("#circ-create .opt-chip").forEach((b) => b.addEventListener("click", () => { draftCirc.tipo = b.dataset.t; renderSocial(); }));
    $$("#cf-met button").forEach((b) => b.addEventListener("click", () => { draftCirc.metrica = b.dataset.m; renderSocial(); }));
    $$("#circ-create .mem-check").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.u;
      if (id === S._id) return; // tú siempre corres
      const i = draftCirc.miembros.indexOf(id);
      if (i >= 0) draftCirc.miembros.splice(i, 1); else draftCirc.miembros.push(id);
      renderSocial();
    }));
    $("#cf-crear").addEventListener("click", () => {
      if (!draftCirc.nombre.trim()) { alert("Ponle nombre al círculo."); return; }
      const c = { id: uid(), nombre: draftCirc.nombre.trim(), tipo: draftCirc.tipo, metrica: draftCirc.metrica, miembros: draftCirc.miembros, creado: hoyISO() };
      root.circulos.push(c); saveRoot();
      circSel = c.id; circFormOpen = false; renderSocial();
    });
    $("#cf-cancel").addEventListener("click", () => { circFormOpen = false; renderSocial(); });
  } else { form.innerHTML = ""; }

  // carrera
  const wrap = $("#race-wrap");
  const c = circs.find((x) => x.id === circSel);
  if (!c) {
    wrap.innerHTML = circFormOpen ? "" : `<div class="race-card"><div class="race-empty">
      Aún no tienes círculos. Crea el primero — invita a tu familia creando sus perfiles
      (menú de usuario → Nuevo perfil) y luego ármales su carrera.</div></div>`;
    return;
  }
  const filas = circProgress(c);
  const maxPct = Math.max(...filas.map((f) => f.pct));
  wrap.innerHTML = `<div class="race-card">
    <div class="race-head">
      <h3>${c.nombre} <span class="k" style="margin-left:6px">${c.tipo}</span></h3>
      <span class="meta-lbl">${c.metrica === "racha" ? "CARRERA POR RACHA · META 30 DÍAS" : "CARRERA SEMANAL · META 100%"} — META →</span>
    </div>
    ${filas.map((f) => {
      const esLider = f.pct === maxPct && f.pct > 0;
      const esYo = f.u._id === S._id;
      const left = Math.max(3, Math.min(97, f.pct));
      return `<div class="race-lane">
        <div class="race-info">
          <span class="nm">${f.u.nombre}${esYo ? " (tú)" : ""}${esLider ? '<span class="lead-tag">LÍDER</span>' : ""}</span>
          <span style="display:flex;gap:10px;align-items:center;">
            <span class="val">${f.label}</span>
            ${esYo ? "" : `<button class="btn-push" data-push="${f.u._id}">Empujar</button>`}
          </span>
        </div>
        <div class="race-track">
          <div class="race-run ${esLider ? "lead" : ""} ${esYo ? "me" : ""}" data-goal="${left}">${initial(f.u.nombre)}</div>
        </div>
      </div>`;
    }).join("")}
    <div class="btn-row" style="margin-top:16px;">
      <button class="btn danger" id="circ-del">Eliminar círculo</button>
    </div>
  </div>`;

  // animación de carrera: los corredores salen del inicio hacia su posición
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$("#race-wrap .race-run").forEach((r) => { r.style.left = r.dataset.goal + "%"; });
  }));

  $$("#race-wrap .btn-push").forEach((b) => b.addEventListener("click", () => empujar(b.dataset.push, b)));
  $("#circ-del").addEventListener("click", () => {
    if (!confirm(`¿Eliminar el círculo "${c.nombre}"?`)) return;
    root.circulos = root.circulos.filter((x) => x.id !== c.id);
    saveRoot(); circSel = null; renderSocial();
  });
}

/* ============================================================
   ASISTENTE
   ============================================================ */
function pushMsg(rol, texto, src) { S.chat.push({ rol, texto, src: src || null }); if (S.chat.length > 60) S.chat = S.chat.slice(-60); save(); renderChat(); }
function renderChat() {
  const log = $("#chat-log"); if (!log) return; log.innerHTML = "";
  if (!S.chat.length) {
    const areas = S.encuesta ? S.encuesta.areas.map((a) => AREAS[a].label.toLowerCase()).slice(0, 3).join(", ") : "tus metas";
    pushMsg("a", `Hola ${S.nombre}. Soy tu asistente de metas. Ya conozco tu encuesta: trabajas en ${areas}, tu meta #1 y tu día de hoy.\n\nUsa los botones rápidos o pregúntame lo que sea. Con tu API key de Claude (en Perfil) me convierto en un JARVIS completo.`, "local");
    return;
  }
  for (const m of S.chat) {
    const div = document.createElement("div"); div.className = "msg " + (m.rol === "u" ? "u" : "a"); div.textContent = m.texto;
    if (m.rol === "a" && m.src) { const s = document.createElement("span"); s.className = "src"; s.textContent = m.src === "claude" ? "Claude · contexto completo" : "asistente local"; div.appendChild(s); }
    log.appendChild(div);
  }
  log.scrollTop = log.scrollHeight;
}
function brainBriefing() {
  const { actual, siguiente } = bloqueActualYSiguiente(); const r = racha(); const ws = weekScore();
  const proximos = S.metas.map((m) => ({ m, p: paceMeta(m) })).filter((x) => x.p.proximo).sort((a, b) => a.p.proximo.f < b.p.proximo.f ? -1 : 1);
  const prox = proximos[0];
  const l = [`Briefing · ${fechaLarga(new Date())}`, ``,
    actual ? `En curso: ${actual.titulo} (${actual.ini}–${actual.fin}).` : siguiente ? `Siguiente bloque: ${siguiente.titulo} a las ${siguiente.ini}.` : `El día ya no tiene bloques pendientes.`,
    `Semana: ${ws}% ejecutado (meta ≥85%). Racha: ${r.dias} días.`];
  if (prox) l.push(`Hito más próximo: "${prox.p.proximo.t}" (${prox.m.nombre}) para el ${prox.p.proximo.f}.`);
  const atras = S.metas.map((m) => ({ m, p: paceMeta(m) })).filter((x) => x.p.atrasado);
  if (atras.length) l.push(`Atención: ${atras.map((x) => x.m.nombre).join(", ")} con hito vencido.`);
  const sinVer = (S.nudges || []).filter((n) => !n.visto);
  sinVer.forEach((n) => l.push(`${n.de} te empujó: "${n.texto}"`));
  misCirculos().forEach((c) => {
    const filas = circProgress(c);
    const yo = filas.findIndex((f) => f.u._id === S._id);
    if (filas.length > 1 && yo >= 0) l.push(`Círculo ${c.nombre}: vas ${yo + 1}º de ${filas.length}${yo === 0 ? " — defiende el liderato." : ` — ${filas[0].u.nombre} va adelante.`}`);
  });
  if (S.perfil.carta) l.push(``, `Tu futuro yo te escribió: "${S.perfil.carta.slice(0, 140)}${S.perfil.carta.length > 140 ? "…" : ""}"`);
  return l.join("\n");
}
function brainAhora() {
  const { actual, siguiente } = bloqueActualYSiguiente();
  if (actual) { const meta = S.metas.find((m) => m.id === actual.meta); return `Ahora toca: ${actual.titulo} (hasta las ${actual.fin}).` + (meta ? `\nEste bloque alimenta "${meta.nombre}" — ${paceMeta(meta).dias} días restantes.` : "") + `\nCero multitasking. Márcalo al terminar.`; }
  if (siguiente) return `Ahora tienes hueco. El siguiente bloque es ${siguiente.titulo} a las ${siguiente.ini}. Si quieres adelantar, dime "reorganiza mi día".`;
  return `Ya no queda nada programado hoy. Cierra el día ("cierre del día") y a dormir a las ${S.perfil.dormir}.`;
}
function brainProgreso() {
  if (!S.metas.length) return "Aún no tienes metas. Rehaz tu encuesta desde Perfil.";
  return S.metas.map((m) => { const p = paceMeta(m); return `${m.foco ? "◆" : "·"} ${m.nombre}\n   ${p.hechos}/${p.total} hitos · ${p.dias} días restantes · ${p.estado}`; }).join("\n") + `\n\nSemana actual: ${weekScore()}% de ejecución (meta ≥85%).`;
}
function brainReplan() {
  replanearHoy();
  const pend = bloquesDe(hoyISO()).filter((b) => !isChecked(hoyISO(), b.slug) && toMin(b.fin) > nowMin());
  if (!pend.length) return `No había bloques pendientes que mover.`;
  return `Listo — recorrí tus ${pend.length} bloques pendientes para empezar ahora:\n` + pend.map((b) => `  ${b.ini} ${b.titulo}`).join("\n") + `\nEl plan perfecto es el que sí ejecutas.`;
}
function brainCierre() {
  const hoy = hoyISO(); const bloques = bloquesDe(hoy);
  const hechos = bloques.filter((b) => isChecked(hoy, b.slug)); const faltan = bloques.filter((b) => !isChecked(hoy, b.slug));
  const sc = dayScore(hoy) || 0;
  const l = [`Cierre del día · ${sc}% ejecutado (${hechos.length}/${bloques.length} bloques)`, ``];
  if (faltan.length) l.push(`Quedó pendiente: ${faltan.map((b) => b.titulo.split("·")[0].trim()).join(", ")}.`);
  l.push(sc >= 85 ? `Día de campeonato. Así se ve la mejor versión de ti.` : sc >= 60 ? `Día sólido. Mañana aprieta un bloque más.` : `Día flojo — pasa. Lo que no pasa es fallar dos días seguidos. Mañana el ritual de las ${S.perfil.despertar} no se negocia.`);
  l.push(``, `Mañana: despertar ${S.perfil.despertar}. Pantallas fuera, a dormir.`);
  return l.join("\n");
}
const CHIP_FN = { briefing: brainBriefing, ahora: brainAhora, progreso: brainProgreso, replanear: brainReplan, cierre: brainCierre };
function brainLocal(q) {
  const t = q.toLowerCase();
  if (/(briefing|buenos días|resumen del día)/.test(t)) return brainBriefing();
  if (/(qué sigue|que sigue|ahora|siguiente|qué hago|que hago)/.test(t)) return brainAhora();
  if (/(cómo voy|como voy|progreso|metas|avance)/.test(t)) return brainProgreso();
  if (/(reorganiza|replan|se me fue|voy tarde|mueve)/.test(t)) return brainReplan();
  if (/(cierre|cerrar el día|dormir|terminé|termine)/.test(t)) return brainCierre();
  return `Para respuestas a la medida, agrega tu API key de Claude en Perfil.\n\nMientras, pídeme: "briefing", "¿qué sigue?", "¿cómo voy?", "reorganiza mi día" o "cierre del día".`;
}
function contexto() {
  const hoy = hoyISO();
  const bloques = bloquesDe(hoy).map((b) => `${isChecked(hoy, b.slug) ? "[x]" : "[ ]"} ${b.ini}-${b.fin} ${b.titulo}`);
  const metas = S.metas.map((m) => { const p = paceMeta(m); return `- ${m.nombre}${m.foco ? " (FOCO)" : ""} | fecha ${m.fecha} (${p.dias} días) | métrica: ${m.metrica} | hitos ${p.hechos}/${p.total} | ${p.estado} | próximo: ${p.proximo ? p.proximo.t + " (" + p.proximo.f + ")" : "—"}`; });
  const e = S.encuesta || {};
  return [
    `Perfil: ${S.nombre}${e.edad ? ", " + e.edad + " años" : ""}${e.ciudad ? ", " + e.ciudad : ""}. Despierta ${S.perfil.despertar}, duerme ${S.perfil.dormir}. Intensidad: ${e.intensidad || "—"}. Mayor obstáculo: ${e.obstaculo || "—"}.`,
    S.perfil.carta ? `Carta a su futuro yo: "${S.perfil.carta}"` : "",
    ``, `METAS:`, ...metas,
    ``, `PLAN DE HOY (${fechaLarga(new Date())}, son las ${toHHMM(nowMin())}):`, ...bloques,
    ``, `Score hoy: ${dayScore(hoy) || 0}%. Semana: ${weekScore()}% (meta ≥85%). Racha: ${racha().dias} días.`,
    ...misCirculos().map((c) => {
      const filas = circProgress(c);
      return `Círculo social "${c.nombre}" (${c.metrica}): ` + filas.map((f, i) => `${i + 1}º ${f.u.nombre} ${f.label}${f.u._id === S._id ? " (él/ella)" : ""}`).join(", ");
    }),
  ].filter((x) => x !== "").join("\n");
}
async function askClaude(q) {
  const system = `Eres el asistente personal de metas de ${S.nombre} en la app GOAL ACHIEVER — un JARVIS práctico y directo, en español. Ayúdale a decidir, priorizar y ejecutar su día para lograr sus metas. Reglas: honestidad brutal, respuestas cortas y accionables, conecta siempre el consejo con sus metas y su plan de hoy, y ten en cuenta su mayor obstáculo. Estado actual:\n\n${contexto()}`;
  const history = S.chat.slice(-10).map((m) => ({ role: m.rol === "u" ? "user" : "assistant", content: m.texto }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": S.perfil.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: 800, system, messages: [...history, { role: "user", content: q }] }),
  });
  if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err && err.error ? err.error.message : "HTTP " + res.status); }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "(respuesta vacía)";
}
async function responder(q) {
  pushMsg("u", q);
  if (S.perfil.apiKey) {
    pushMsg("a", "…", "claude");
    try { S.chat[S.chat.length - 1].texto = await askClaude(q); }
    catch (e) { S.chat[S.chat.length - 1].texto = `No pude hablar con Claude (${e.message}). Te respondo en modo local:\n\n${brainLocal(q)}`; S.chat[S.chat.length - 1].src = "local"; }
    save(); renderChat();
  } else { pushMsg("a", brainLocal(q), "local"); }
}
$("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#chat-in").value.trim(); if (!q) return; $("#chat-in").value = ""; responder(q); });
$$("#chips .chip").forEach((c) => c.addEventListener("click", () => { const fn = CHIP_FN[c.dataset.q]; pushMsg("u", c.textContent.trim()); pushMsg("a", fn(), "local"); }));

/* ============================================================
   PERFIL
   ============================================================ */
function renderPerfil() {
  $("#p-nombre").value = S.perfil.nombre; $("#p-ciudad").value = S.perfil.ciudad;
  $("#p-despertar").value = S.perfil.despertar; $("#p-dormir").value = S.perfil.dormir;
  $("#p-carta").value = S.perfil.carta; $("#p-apikey").value = S.perfil.apiKey;
}
$("#btn-save").addEventListener("click", () => {
  const prevWake = S.perfil.despertar, prevSleep = S.perfil.dormir;
  S.perfil.nombre = $("#p-nombre").value.trim() || S.nombre; S.nombre = S.perfil.nombre;
  S.perfil.ciudad = $("#p-ciudad").value.trim();
  S.perfil.despertar = $("#p-despertar").value || "06:30"; S.perfil.dormir = $("#p-dormir").value || "22:30";
  S.perfil.carta = $("#p-carta").value.trim(); S.perfil.apiKey = $("#p-apikey").value.trim();
  // si cambió el horario, regenerar plan respetando encuesta
  if (S.encuesta && (prevWake !== S.perfil.despertar || prevSleep !== S.perfil.dormir)) {
    S.encuesta.despertar = S.perfil.despertar; S.encuesta.dormir = S.perfil.dormir;
    S.plan = generarPlanSemanal(S.encuesta); S.overrides = {};
  }
  save(); renderUserChip();
  $("#perfil-saved").classList.add("on"); setTimeout(() => $("#perfil-saved").classList.remove("on"), 1800);
});
$("#btn-reonboard").addEventListener("click", () => { if (confirm("¿Rehacer tu encuesta? Se regeneran metas y plan (los checks se conservan).")) startOnboarding(); });
$("#btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `goal-achiever-${S.nombre}-${hoyISO()}.json`; a.click();
});
$("#btn-del-user").addEventListener("click", () => {
  if (!confirm(`¿Eliminar el perfil de ${S.nombre} y todos sus datos? No se puede deshacer.`)) return;
  const delId = S._id;
  root.circulos.forEach((c) => { c.miembros = c.miembros.filter((id) => id !== delId); });
  root.circulos = root.circulos.filter((c) => c.miembros.length > 0);
  delete root.users[delId]; root.activeId = null; saveRoot(); S = null;
  Object.keys(root.users).length ? openLogin() : showGateScreen("gate-landing");
});

/* ============================================================
   RENDER MAESTRO + BOOT
   ============================================================ */
function render() {
  if (!S) return;
  if (vista === "hoy") renderHoy();
  if (vista === "semana") renderSemana();
  if (vista === "calendario") renderCal();
  if (vista === "metas") renderMetas();
  if (vista === "social") renderSocial();
  if (vista === "asistente") renderChat();
  if (vista === "perfil") renderPerfil();
}

function boot() {
  const active = root.activeId && root.users[root.activeId];
  if (active && active.onboarded) { S = root.users[root.activeId]; enterApp(); }
  else if (active && !active.onboarded) { S = root.users[root.activeId]; startOnboarding(); }
  else { showGateScreen("gate-landing"); }
  tick();
}
boot();
