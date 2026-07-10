/* ============================================================
   GOAL ACHIEVER — nube familiar (Supabase)
   Modelo: una "casa" = un código compartido. Todos los dispositivos
   con el mismo código sincronizan perfiles, círculos y empujones.
   Offline-first: localStorage manda; la nube reconcilia.
   REST directo (PostgREST) — sin SDK, sin build.
   ============================================================ */

const Sync = (() => {
  "use strict";

  const URL_ = "https://fnxifbddgjyzwrolprel.supabase.co";
  const KEY_ = "sb_publishable_w7oXdy379pRmyYfrtmdwWA_s0GcNacO";
  const TABLA = "ga_hogares";
  const LS_CASA = "ga_casa";

  let casa = localStorage.getItem(LS_CASA) || "";
  let estado = casa ? "conectando" : "off"; // off | conectando | activa | sin-tabla | error
  let timer = null;
  let aplicando = false; // evita eco push mientras aplicamos lo remoto

  const H = {
    "apikey": KEY_,
    "Authorization": "Bearer " + KEY_,
    "Content-Type": "application/json",
  };
  const endpoint = () => `${URL_}/rest/v1/${TABLA}`;

  /* ---------- merge ---------- */
  function limpiarParaNube(root) {
    const copia = JSON.parse(JSON.stringify(root));
    Object.values(copia.users || {}).forEach((u) => {
      if (u.perfil) u.perfil.apiKey = ""; // la API key jamás sale del dispositivo
      delete u.chat;                       // el chat es personal y local
    });
    return copia;
  }

  function merge(remoto, local) {
    const out = { activeId: local.activeId, users: {}, circulos: [], nudges: [], tumbas: [] };
    out.tumbas = [...new Set([...(remoto.tumbas || []), ...(local.tumbas || [])])];

    // usuarios: gana el _rev más nuevo; api key y chat siempre locales
    const ids = new Set([...Object.keys(remoto.users || {}), ...Object.keys(local.users || {})]);
    ids.forEach((id) => {
      const r = (remoto.users || {})[id], l = (local.users || {})[id];
      const ganador = !r ? l : !l ? r : ((l._rev || 0) >= (r._rev || 0) ? l : r);
      const u = JSON.parse(JSON.stringify(ganador));
      if (l) {
        u.chat = l.chat || [];
        if (l.perfil && l.perfil.apiKey) { u.perfil = u.perfil || {}; u.perfil.apiKey = l.perfil.apiKey; }
      } else { u.chat = u.chat || []; }
      out.users[id] = u;
    });
    out.tumbas.forEach((id) => { delete out.users[id]; });

    // círculos: por id, gana _rev más nuevo; tumbas eliminan;
    // los registros del reto se UNEN por id (dos personas pueden aportar a la vez)
    const circ = {};
    [...(remoto.circulos || []), ...(local.circulos || [])].forEach((c) => {
      if (!circ[c.id]) { circ[c.id] = JSON.parse(JSON.stringify(c)); return; }
      const prev = circ[c.id];
      const gana = (c._rev || 0) > (prev._rev || 0) ? c : prev;
      const regs = {};
      [...(prev.registros || []), ...(c.registros || [])].forEach((r) => { regs[r.id] = r; });
      circ[c.id] = JSON.parse(JSON.stringify(gana));
      circ[c.id].registros = Object.values(regs);
    });
    out.circulos = Object.values(circ).filter((c) => !out.tumbas.includes(c.id));

    // empujones: unión por id; visto se conserva si alguien ya lo vio
    const nud = {};
    [...(remoto.nudges || []), ...(local.nudges || [])].forEach((n) => {
      if (!nud[n.id]) nud[n.id] = n;
      else nud[n.id].visto = nud[n.id].visto || n.visto;
    });
    out.nudges = Object.values(nud).slice(-200);
    return out;
  }

  /* ---------- red ---------- */
  async function pull() {
    if (!casa) return null;
    const res = await fetch(`${endpoint()}?codigo=eq.${encodeURIComponent(casa)}&select=data`, { headers: H });
    if (res.status === 404) { estado = "sin-tabla"; return null; }
    if (!res.ok) {
      const t = await res.text();
      estado = /relation|does not exist|schema cache/i.test(t) ? "sin-tabla" : "error";
      return null;
    }
    estado = "activa";
    const rows = await res.json();
    return rows.length ? rows[0].data : null;
  }

  async function push(root) {
    if (!casa) return false;
    const res = await fetch(`${endpoint()}?on_conflict=codigo`, {
      method: "POST",
      headers: { ...H, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify([{ codigo: casa, data: limpiarParaNube(root), updated_at: new Date().toISOString() }]),
    });
    if (!res.ok) {
      const t = await res.text();
      estado = /relation|does not exist|schema cache/i.test(t) ? "sin-tabla" : "error";
      return false;
    }
    estado = "activa";
    return true;
  }

  /* ---------- ciclo ---------- */
  async function ciclo() {
    if (!casa || aplicando) return;
    try {
      const remoto = await pull();
      if (estado !== "activa") { window.__syncUI && window.__syncUI(); return; }
      const local = window.__gaRoot();
      const unido = remoto ? merge(remoto, local) : local;
      aplicando = true;
      window.__gaAplicar(unido);
      aplicando = false;
      await push(unido);
    } catch (e) { estado = "error"; aplicando = false; }
    window.__syncUI && window.__syncUI();
  }

  function pushSoon() {
    if (!casa || aplicando) return;
    clearTimeout(timer);
    timer = setTimeout(ciclo, 1500);
  }

  /* ---------- API pública ---------- */
  function nuevoCodigo() {
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return "CASA-" + s;
  }
  async function crearCasa() {
    casa = nuevoCodigo();
    localStorage.setItem(LS_CASA, casa);
    estado = "conectando";
    await ciclo();
    return casa;
  }
  async function unirse(codigo) {
    casa = codigo.trim().toUpperCase();
    localStorage.setItem(LS_CASA, casa);
    estado = "conectando";
    await ciclo();
    return estado;
  }
  function salir() { casa = ""; localStorage.removeItem(LS_CASA); estado = "off"; }

  // arranque + refresco periódico
  window.addEventListener("load", () => { if (casa) setTimeout(ciclo, 800); });
  setInterval(() => { if (casa && document.visibilityState === "visible") ciclo(); }, 45000);
  document.addEventListener("visibilitychange", () => { if (casa && document.visibilityState === "visible") ciclo(); });

  return {
    pushSoon, ciclo, crearCasa, unirse, salir,
    get casa() { return casa; },
    get estado() { return estado; },
  };
})();
