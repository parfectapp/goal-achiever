/* ============================================================
   GOAL ACHIEVER — landing inmersiva
   Fondo WebGL (anillo de partículas = la órbita de tus días),
   fly-through con scroll en Z real, reveals tipográficos,
   smooth scroll Lenis + GSAP ScrollTrigger, grain, cursor.
   Degrada con elegancia si falta red o hay reduced-motion.
   ============================================================ */

(function () {
  "use strict";

  const gate = document.getElementById("gate");
  const screen = document.getElementById("gate-landing");
  const canvas = document.getElementById("gl");
  if (!gate || !screen || !canvas) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasTHREE = typeof THREE !== "undefined";
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const hasLenis = typeof Lenis !== "undefined";

  // el <body> arranca con .no-fx (todo visible). Si podemos animar, lo quitamos.
  if (hasGSAP && !reduced) document.body.classList.remove("no-fx");

  const visible = () => gate.classList.contains("on") && screen.classList.contains("on");

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasLenis && hasGSAP && !reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  // red de seguridad: procesa los triggers aunque el ticker esté throttleado
  if (hasGSAP && !reduced) window.addEventListener("scroll", () => ScrollTrigger.update(), { passive: true });

  /* ---------- escena 3D: la órbita de los días ---------- */
  let renderer, scene, camera, ring, stars;
  const state = { p: 0, mx: 0, my: 0, smx: 0, smy: 0 };

  function initScene() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a0b, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.016);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 0, 26);

    // anillo: 365 días orbitando — distribución de toro con grosor gaussiano
    const N = 6500, R = 13;
    const pos = new Float32Array(N * 3);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = R + gauss() * 2.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = gauss() * 0.9;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    ring = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xedebe6, size: 0.07, transparent: true, opacity: 0.85,
      depthWrite: false, sizeAttenuation: true,
    }));
    ring.rotation.x = 1.18;
    scene.add(ring);

    // polvo lejano
    const M = 900;
    const pos2 = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize().multiplyScalar(40 + Math.random() * 60);
      pos2[i * 3] = v.x; pos2[i * 3 + 1] = v.y; pos2[i * 3 + 2] = v.z;
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.BufferAttribute(pos2, 3));
    stars = new THREE.Points(g2, new THREE.PointsMaterial({
      color: 0xedebe6, size: 0.14, transparent: true, opacity: 0.4, depthWrite: false,
    }));
    scene.add(stars);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("mousemove", (e) => {
      state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      state.my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible()) return;
      const t = clock.getElapsedTime();

      // progreso de scroll 0→1 (independiente de librerías)
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
      state.p += (target - state.p) * 0.06; // inercia — el mundo tiene peso
      state.smx += (state.mx - state.smx) * 0.04;
      state.smy += (state.my - state.smy) * 0.04;
      const p = state.p;

      // fly-through: el anillo crece y te atraviesa; al final se abre en horizonte
      const s = 1 + p * 3.6;
      ring.scale.set(s, s, s);
      ring.rotation.z = t * 0.05 + p * 2.2;
      ring.rotation.x = 1.18 - p * 0.75;
      ring.material.opacity = 0.85 - p * 0.25;
      ring.material.size = 0.07 + p * 0.05;

      stars.rotation.y = t * 0.008 + p * 0.5;

      camera.position.x = state.smx * 1.6;
      camera.position.y = -state.smy * 1.1 - p * 2.4;
      camera.lookAt(0, -p * 2.4, 0);

      renderer.render(scene, camera);
    })();
  }

  if (hasTHREE && !reduced) {
    try { initScene(); } catch (e) { /* sin WebGL: fondo negro plano */ }
  }

  /* ---------- coreografía de scroll (GSAP) ---------- */
  function initAnims() {
    gsap.registerPlugin(ScrollTrigger);

    // hero: líneas suben desde la máscara
    gsap.set(".l-h1 .line > span", { yPercent: 115 });
    gsap.to(".l-h1 .line > span", {
      yPercent: 0, duration: 1.3, ease: "power4.out", stagger: 0.09, delay: 0.25,
    });

    // reveals genéricos
    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // manifiesto: palabra por palabra al ritmo del scroll
    const man = document.getElementById("manifesto-txt");
    if (man) {
      man.innerHTML = man.textContent.trim().split(/\s+/)
        .map((w) => `<span class="w">${w}</span>`).join(" ");
      gsap.to("#manifesto-txt .w", {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: ".l-manifesto", start: "top 75%", end: "center 45%", scrub: 0.6 },
      });
    }

    // números gigantes: parallax lateral
    document.querySelectorAll(".l-pillar").forEach((sec, i) => {
      const num = sec.querySelector(".l-num");
      gsap.fromTo(num, { xPercent: i % 2 ? -14 : 14 }, {
        xPercent: i % 2 ? 6 : -6, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
      });
      const h2 = sec.querySelector("h2");
      gsap.fromTo(h2, { yPercent: 14 }, {
        yPercent: -6, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // cta final: el "HOY" respira al llegar
    gsap.from(".l-final-hoy em", {
      scale: 0.7, opacity: 0, duration: 1.2, ease: "back.out(1.6)",
      scrollTrigger: { trigger: ".l-final", start: "top 60%" },
    });
  }

  if (hasGSAP && !reduced) initAnims();

  /* ---------- cursor ---------- */
  const dot = document.getElementById("cursor-dot");
  if (dot && window.matchMedia("(hover: hover)").matches) {
    let cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function cur() {
      requestAnimationFrame(cur);
      if (!visible()) return;
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      dot.style.transform = `translate(${cx - 5}px, ${cy - 5}px)`;
    })();
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("button, a, input, textarea")) dot.classList.add("big");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("button, a, input, textarea")) dot.classList.remove("big");
    });
  }

  /* ---------- pausa/reanuda al entrar y salir de la landing ---------- */
  const sync = () => {
    if (visible()) {
      if (lenis) { lenis.start(); lenis.scrollTo(0, { immediate: true }); }
      if (hasGSAP) ScrollTrigger.refresh();
    } else if (lenis) { lenis.stop(); }
  };
  new MutationObserver(sync).observe(gate, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(sync).observe(screen, { attributes: true, attributeFilter: ["class"] });
  sync();
})();
