(() => {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => innerWidth <= 820;

  /* smooth scroll */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const el = document.querySelector(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    nav.classList.remove("open");
    lenis ? lenis.scrollTo(el, { offset: a.getAttribute("href") === "#top" ? 0 : -60 }) : el.scrollIntoView({ behavior: "smooth" });
  }));

  /* nav: hide on scroll down, show on scroll up */
  const nav = document.querySelector(".nav");
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-hidden", y > lastY && y > 400 && !nav.classList.contains("open"));
    lastY = y;
  }, { passive: true });
  document.querySelector(".burger").addEventListener("click", () => nav.classList.toggle("open"));

  /* language switch */
  const i18n = document.querySelectorAll("[data-en]");
  i18n.forEach(el => el.dataset.sl = el.innerHTML);
  const setLang = l => {
    i18n.forEach(el => el.innerHTML = el.dataset[l]);
    document.documentElement.lang = l;
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("is-active", b.dataset.lang === l));
    splitFill();
    renderList();
    try { localStorage.setItem("novos-lang", l); } catch (e) {}
    ScrollTrigger.refresh();
  };
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* loader */
  const loader = document.querySelector(".loader");
  const count = { v: 0 };
  const intro = gsap.timeline({ paused: true });
  intro.from(".hero-l", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out" }, 0)
       .from(".hero-r", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out" }, .08)
       .from(".hero-media", { clipPath: "inset(50% 50% 50% 50%)", duration: 1.3, ease: "expo.inOut" }, 0)
       .from(".hero-foot > *", { y: 30, opacity: 0, duration: 1, ease: "power3.out" }, .4)
       .from(".nav", { opacity: 0, duration: 1, ease: "power2.out" }, .2);
  if (reduce) { loader.remove(); intro.progress(1); }
  else {
    gsap.to(count, { v: 100, duration: 1.4, ease: "power2.inOut",
      onUpdate: () => loader.querySelector(".loader-count").textContent = Math.round(count.v),
      onComplete: done
    });
    function done() {
      if (done.ran) return; done.ran = true;
      gsap.to(loader, { opacity: 0, duration: .6, onComplete: () => { loader.remove(); intro.play(); } });
    }
    setTimeout(done, 2600);
  }

  /* hero: words part, image grows to full screen */
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: true } });
  heroTl.to(".hero-media", { width: "100vw", height: "100vh", marginTop: 0, ease: "none" }, 0)
        .to(".hero-media img", { scale: 1, ease: "none" }, 0)
        .to(".hero-l", { xPercent: -120, ease: "none" }, 0)
        .to(".hero-r", { xPercent: 120, ease: "none" }, 0)
        .to(".hero-foot", { opacity: 0, y: -40, ease: "none", duration: .3 }, 0);
  if (mobile()) heroTl.to(".hero-l", { yPercent: -200 }, 0).to(".hero-r", { yPercent: 200 }, 0);

  /* gray to ink text fill */
  function splitFill() {
    document.querySelectorAll(".fill-text").forEach(el => {
      ScrollTrigger.getById("fill")?.kill();
      el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
      gsap.to(el.querySelectorAll(".w"), { color: "#0b1020", stagger: .1, ease: "none",
        scrollTrigger: { id: "fill", trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
  }
  splitFill();

  gsap.to(".client-words li", { color: "#0b1020", stagger: .15, ease: "none",
    scrollTrigger: { trigger: ".client-words", start: "top 80%", end: "bottom 50%", scrub: true } });

  /* counters */
  document.querySelectorAll("[data-count]").forEach(b => {
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: b, start: "top 88%", once: true,
      onEnter: () => gsap.to(o, { v: +b.dataset.count, duration: 1.6, ease: "power3.out", onUpdate: () => b.textContent = Math.round(o.v) }) });
  });

  /* fields: active item follows scroll, image wipes in */
  const fields = [...document.querySelectorAll(".field")];
  const figs = [...document.querySelectorAll(".fields-media figure")];
  const bars = [...document.querySelectorAll(".fields-progress i")];
  let cur = 0;
  const activate = i => {
    if (i === cur) return;
    figs.forEach(f => f.classList.remove("was-active"));
    figs[cur].classList.add("was-active");
    cur = i;
    fields.forEach((f, k) => f.classList.toggle("is-active", k === i));
    figs.forEach((f, k) => f.classList.toggle("is-active", k === i));
    bars.forEach((b, k) => b.classList.toggle("on", k <= i));
  };
  bars[0].classList.add("on");
  fields.forEach((f, i) => f.addEventListener("click", () => activate(i)));
  ScrollTrigger.matchMedia({
    "(min-width: 821px)": () => ScrollTrigger.create({ trigger: ".fields-stage", start: "top top+=" + (nav.offsetHeight + 40), end: "bottom bottom",
      onUpdate: s => activate(Math.min(2, Math.floor(s.progress * 3))) }),
    "(max-width: 820px)": () => fields.forEach((f, i) => ScrollTrigger.create({ trigger: f, start: "top 60%", end: "bottom 60%", onEnter: () => activate(i), onEnterBack: () => activate(i) }))
  });

  /* mini parallax inside frames */
  if (!reduce) {
    document.querySelectorAll(".craft-media img, .about-media img, .bento img, .fields-media img").forEach(img => {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 4, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* reveals */
  gsap.utils.toArray(".fields-head h2, .craft-grid h2, .craft-side, .map-head, .clients h2, .gallery-head, .bento figure, .about-grid h2, .about-text, .contact h2, .contact-mail, .contact-grid > div").forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* world map: their map, redrawn as dots, with every plant */
  const plants = [
    { c: "Slovenija", en: "Slovenia", n: "Ptuj", f: "NOVOS", x: 1010, y: 190, hq: true },
    { c: "Nemčija", en: "Germany", n: "Ingolstadt", f: "Audi", x: 992, y: 183 },
    { c: "Nemčija", en: "Germany", n: "Neckarsulm", f: "Audi", x: 982, y: 180 },
    { c: "Nemčija", en: "Germany", n: "München", f: "BMW", x: 994, y: 187 },
    { c: "Nemčija", en: "Germany", n: "Dingolfing", f: "BMW", x: 999, y: 184 },
    { c: "Nemčija", en: "Germany", n: "Regensburg", f: "BMW", x: 996, y: 179 },
    { c: "Nemčija", en: "Germany", n: "Leipzig", f: "BMW", x: 995, y: 168 },
    { c: "Nemčija", en: "Germany", n: "Sindelfingen", f: "Daimler", x: 979, y: 184 },
    { c: "Nemčija", en: "Germany", n: "Esslingen", f: "Daimler", x: 983, y: 186 },
    { c: "Nemčija", en: "Germany", n: "Rastatt", f: "Daimler", x: 974, y: 183 },
    { c: "Nemčija", en: "Germany", n: "Bremen", f: "Daimler", x: 979, y: 162 },
    { c: "Nemčija", en: "Germany", n: "Rüsselsheim", f: "Opel", x: 976, y: 176 },
    { c: "Nemčija", en: "Germany", n: "Bochum", f: "Opel", x: 970, y: 168 },
    { c: "Slovaška", en: "Slovakia", n: "Bratislava", f: "VW", x: 1017, y: 185 },
    { c: "Avstrija", en: "Austria", n: "Graz", f: "Steyr", x: 1006, y: 189 },
    { c: "Velika Britanija", en: "United Kingdom", n: "Oxford", f: "Mini", x: 899, y: 166 },
    { c: "Velika Britanija", en: "United Kingdom", n: "Birmingham", f: "Vauxhall", x: 896, y: 161 },
    { c: "ZDA", en: "USA", n: "Spartanburg", f: "BMW", x: 452, y: 236 },
    { c: "ZDA", en: "USA", n: "Tuscaloosa", f: "Daimler", x: 432, y: 243 },
    { c: "ZDA", en: "USA", n: "Chattanooga", f: "VW", x: 440, y: 233 },
    { c: "ZDA", en: "USA", n: "Gap, Pennsylvania", f: "URBN", x: 470, y: 212 },
    { c: "ZDA", en: "USA", n: "San Pablo", f: "UPS · Vanderlande", x: 272, y: 212 },
    { c: "Brazilija", en: "Brazil", n: "Curitiba", f: "Audi", x: 622, y: 440 },
    { c: "Kitajska", en: "China", n: "Chengdu", f: "VW", x: 1505, y: 246 },
    { c: "Kitajska", en: "China", n: "Shanghai", f: "VW", x: 1600, y: 238 },
    { c: "Kitajska", en: "China", n: "Changchun", f: "Audi · VW", x: 1606, y: 180 },
    { c: "Kitajska", en: "China", n: "Shenyang", f: "BMW", x: 1594, y: 190 }
  ];
  const W = 1920, H = 639;
  const wrap = document.querySelector(".map-canvas");
  const canvas = wrap.querySelector("canvas");
  const pinsEl = wrap.querySelector(".map-pins");
  const tip = wrap.querySelector(".map-tip");
  const pins = plants.map(p => {
    const d = document.createElement("i");
    d.className = "pin" + (p.hq ? " hq" : "");
    d.style.left = (p.x / W * 100) + "%";
    d.style.top = (p.y / H * 100) + "%";
    d.addEventListener("mouseenter", () => {
      tip.textContent = `${p.f} · ${p.n}`;
      tip.style.left = d.style.left; tip.style.top = d.style.top; tip.style.opacity = 1;
    });
    d.addEventListener("mouseleave", () => tip.style.opacity = 0);
    pinsEl.appendChild(d);
    return d;
  });
  gsap.to(pins, { scale: 1, duration: .5, ease: "back.out(3)", stagger: { each: .05, from: 0 },
    scrollTrigger: { trigger: wrap, start: "top 75%" } });

  const img = new Image();
  img.src = "assets/img/world_pale.gif";
  img.onload = () => {
    const step = 9;
    const r = devicePixelRatio || 1;
    const draw = () => {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      canvas.width = cw * r; canvas.height = ch * r;
      const ctx = canvas.getContext("2d");
      ctx.scale(r, r);
      let data;
      try {
        const o = document.createElement("canvas"); o.width = W; o.height = H;
        const oc = o.getContext("2d"); oc.drawImage(img, 0, 0);
        data = oc.getImageData(0, 0, W, H).data;
      } catch (e) { ctx.globalAlpha = .6; ctx.drawImage(img, 0, 0, cw, ch); return; }
      const sx = cw / W, dot = Math.max(1.4, step * sx * .32);
      ctx.fillStyle = "#b9c6d6";
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        const k = (y * W + x) * 4;
        const a = data[k + 3], s = data[k] + data[k + 1] + data[k + 2];
        if (a > 100 && s < 700) { ctx.beginPath(); ctx.arc(x * sx, y * sx, dot, 0, 7); ctx.fill(); }
      }
    };
    draw();
    let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 150); });
  };

  const listEl = document.querySelector(".map-list");
  function renderList() {
    const en = document.documentElement.lang === "en";
    const groups = {};
    plants.forEach((p, i) => { const k = en ? p.en : p.c; (groups[k] ||= []).push(i); });
    listEl.innerHTML = "";
    Object.entries(groups).forEach(([name, ids]) => {
      const b = document.createElement("button");
      b.innerHTML = `${name}<span>${ids.length}</span>`;
      b.addEventListener("mouseenter", () => pins.forEach((p, i) => p.classList.toggle("dim", !ids.includes(i))));
      b.addEventListener("mouseleave", () => pins.forEach(p => p.classList.remove("dim")));
      listEl.appendChild(b);
    });
  }
  renderList();

  try { const l = localStorage.getItem("novos-lang"); if (l === "en") setLang("en"); } catch (e) {}
})();
