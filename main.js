/* ============================================================
   The Innovation Department — animations
   Lenis (smooth scroll) + GSAP / ScrollTrigger
   ============================================================ */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-ready");

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------- Anchor links route through Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Scroll-spy: highlight the nav link of the section in view ----------
     Active = the linked section whose top has most recently passed an activation
     line near the top of the viewport. Because the top is the tie-breaker, a
     nested target (e.g. #what inside the #why section) correctly takes over once
     its own top passes the line. */
  (function navSpy() {
    const targets = [...document.querySelectorAll('.nav a[href^="#"]')]
      .map((a) => {
        const el = document.querySelector(a.getAttribute("href"));
        return el ? { a, el } : null;
      })
      .filter(Boolean);
    if (!targets.length) return;

    let current = null;
    function update() {
      const line = window.innerHeight * 0.35;
      let active = null, activeTop = -Infinity;
      for (const t of targets) {
        const top = t.el.getBoundingClientRect().top;
        if (top <= line && top > activeTop) { active = t; activeTop = top; }
      }
      if (active === current) return;
      targets.forEach((t) => {
        const on = t === active;
        t.a.classList.toggle("is-current", on);
        if (on) t.a.setAttribute("aria-current", "true");
        else t.a.removeAttribute("aria-current");
      });
      current = active;
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (lenis) lenis.on("scroll", onScroll);
    update();
  })();

  /* ---------- Hero "sand" cursor trail ----------
     A pixel-trail effect (grid cells light up as the cursor passes) styled as
     warm sand grains; an SVG gooey filter melts neighbours into flowing blobs.
     Independent of GSAP; skipped for reduced-motion. */
  (function sandTrail() {
    if (reduceMotion) return;
    const hero = document.querySelector(".hero");
    const trail = hero && hero.querySelector(".sand-trail");
    if (!trail) return;

    const PIXEL = 30; // grid cell size (px)
    const FADE = 1300; // grain lifetime (ms)
    const SAND = ["#cdb488", "#c2a06a", "#b8925a", "#d9c8a3", "#ad8850"];
    const seen = new Set(); // cells with a live grain (one at a time)
    let lastX = null, lastY = null;

    function grain(x, y, key) {
      const el = document.createElement("span");
      el.className = "sand-cell";
      const jitter = (Math.random() - 0.5) * 6;
      el.style.cssText =
        `left:${x + jitter}px;top:${y}px;width:${PIXEL}px;height:${PIXEL}px;` +
        `background:${SAND[(Math.random() * SAND.length) | 0]};`;
      trail.appendChild(el);
      const drift = 6 + Math.random() * 10; // settle downward like falling sand
      const anim = el.animate(
        [
          { opacity: 0.9, transform: "translateY(0) scale(1)" },
          { opacity: 0, transform: `translateY(${drift}px) scale(0.55)` },
        ],
        { duration: FADE, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }
      );
      anim.onfinish = () => { el.remove(); seen.delete(key); };
    }

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (lastX === null) { lastX = x; lastY = y; }
      // Interpolate across the cells the cursor crossed so fast moves stay continuous.
      const dx = x - lastX, dy = y - lastY;
      const steps = Math.min(Math.ceil(Math.hypot(dx, dy) / (PIXEL * 0.6)), 24) || 1;
      for (let i = 1; i <= steps; i++) {
        const gx = Math.floor((lastX + (dx * i) / steps) / PIXEL);
        const gy = Math.floor((lastY + (dy * i) / steps) / PIXEL);
        const key = gx + "," + gy;
        if (seen.has(key)) continue;
        seen.add(key);
        grain(gx * PIXEL, gy * PIXEL, key);
      }
      lastX = x; lastY = y;
    });
    hero.addEventListener("pointerleave", () => { lastX = lastY = null; });
  })();

  /* ---------- GSAP setup ---------- */
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // Keep ScrollTrigger in sync with Lenis
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Project images: portrait, hover-preview, thumbnails ---------- */
  // Branded placeholder shown until a real image file is dropped in.
  function placeholderURI(text) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
      '<rect width="800" height="600" fill="#EBE3D5"/>' +
      '<rect x="20" y="20" width="760" height="560" fill="none" stroke="#FF5A36" stroke-width="2" stroke-dasharray="10 8"/>' +
      '<text x="50%" y="48%" fill="#1C1A17" font-family="Georgia, serif" font-size="56" font-style="italic" text-anchor="middle">' +
      text +
      "</text>" +
      '<text x="50%" y="60%" fill="#8A8478" font-family="Inter, sans-serif" font-size="22" text-anchor="middle">add image →</text>' +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function withFallback(img, text) {
    img.addEventListener(
      "error",
      function onErr() {
        img.removeEventListener("error", onErr);
        img.src = placeholderURI(text);
      },
      { once: true }
    );
  }

  // Portrait
  const portrait = document.querySelector(".who-photo img[data-fallback]");
  if (portrait) withFallback(portrait, portrait.getAttribute("data-fallback"));

  // Work: media on every project row.
  //   data-video  -> autoplaying, muted, looping clip (one or more comma-separated sources)
  //   data-img + data-img-hover -> still that cross-fades to a second image on hover
  //   data-img only -> single still
  function videoTypeFor(src) {
    const ext = src.split(".").pop().toLowerCase();
    return (
      {
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
        ogg: "video/ogg",
      }[ext] || ""
    );
  }
  function buildStill(item, name) {
    const thumb = document.createElement("span");
    thumb.className = "work-thumb";

    const base = document.createElement("img");
    base.className = "work-thumb-base";
    base.alt = name;
    base.loading = "lazy";
    withFallback(base, name);
    base.src = item.getAttribute("data-img");
    thumb.appendChild(base);

    const hoverSrc = item.getAttribute("data-img-hover");
    if (hoverSrc) {
      const hover = document.createElement("img");
      hover.className = "work-thumb-hover";
      hover.alt = name + " — detail";
      hover.loading = "lazy";
      hover.src = hoverSrc;
      thumb.appendChild(hover);
    }
    return thumb;
  }

  gsap.utils.toArray(".work-item").forEach((item) => {
    const name = item.querySelector(".work-name").textContent.trim();
    const videoAttr = item.getAttribute("data-video");

    let thumb;
    if (videoAttr && !reduceMotion) {
      // Autoplaying clip — falls back to the poster still on any load error.
      thumb = document.createElement("span");
      thumb.className = "work-thumb";
      const video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      const poster = item.getAttribute("data-poster");
      if (poster) video.poster = poster;
      videoAttr.split(",").forEach((raw) => {
        const src = raw.trim();
        if (!src) return;
        const source = document.createElement("source");
        source.src = src;
        source.type = videoTypeFor(src);
        video.appendChild(source);
      });
      video.addEventListener(
        "error",
        function onErr() {
          video.removeEventListener("error", onErr);
          const fallback = buildStill(item, name);
          thumb.replaceWith(fallback);
        },
        { once: true }
      );
      thumb.appendChild(video);
      const playAttempt = video.play();
      if (playAttempt && playAttempt.catch) playAttempt.catch(() => {});
    } else if (videoAttr) {
      // Reduced motion: show the poster still instead of an autoplaying clip.
      thumb = document.createElement("span");
      thumb.className = "work-thumb";
      const img = document.createElement("img");
      img.className = "work-thumb-base";
      img.alt = name;
      img.loading = "lazy";
      withFallback(img, name);
      img.src = item.getAttribute("data-poster") || "";
      thumb.appendChild(img);
    } else {
      thumb = buildStill(item, name);
    }

    // Move the name + description into a caption that overlays the image,
    // revealed with a gradient scrim on hover.
    const caption = document.createElement("span");
    caption.className = "work-caption";
    const nameEl = item.querySelector(".work-name");
    const descEl = item.querySelector(".work-desc");
    if (nameEl) caption.appendChild(nameEl);
    if (descEl) caption.appendChild(descEl);
    thumb.appendChild(caption);

    item.insertBefore(thumb, item.firstChild);
  });

  if (reduceMotion) return; // CSS already shows everything

  /* ---------- Hero intro ---------- */
  const heroLines = gsap.utils.toArray(".hero-title .line > span");
  const introTl = gsap.timeline({ delay: 0.15 });
  introTl
    .to(heroLines, {
      y: "0%",
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.12,
    })
    .from(
      ".hero .eyebrow",
      { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" },
      0
    )
    .to(
      ".hero .reveal-up",
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12 },
      "-=0.7"
    );

  /* ---------- Generic scroll reveals ---------- */
  gsap.utils.toArray(".reveal-up").forEach((el) => {
    if (el.closest(".hero")) return; // handled by intro
    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  /* ---------- Line-by-line reveals (statements) ---------- */
  gsap.utils.toArray(".reveal-line").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      }
    );
  });

  /* ---------- Service cards / steps / work items: subtle stagger ---------- */
  [".services", ".steps", ".work-list"].forEach((sel) => {
    const container = document.querySelector(sel);
    if (!container) return;
    const kids = container.children;
    ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      once: true,
      onEnter: () =>
        gsap.to(kids, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.06,
        }),
    });
  });

  /* ---------- "Dig › Define › Design › Deliver" word highlight ---------- */
  const words = gsap.utils.toArray(".how-title .word");
  if (words.length) {
    words.forEach((word, i) => {
      ScrollTrigger.create({
        trigger: ".how",
        start: () => `top+=${i * 12}% center`,
        end: () => `top+=${(i + 1) * 12}% center`,
        onToggle: (self) => word.classList.toggle("is-active", self.isActive),
      });
    });
    // first word lit by default once section is in view
    ScrollTrigger.create({
      trigger: ".how",
      start: "top 70%",
      once: true,
      onEnter: () => words[0].classList.add("is-active"),
    });
  }

  /* ---------- Subtle hero parallax on scroll ---------- */
  gsap.to(".hero-title", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll("[data-magnetic]").forEach((btn) => {
    const strength = 0.35;
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      gsap.to(btn, { x, y, duration: 0.5, ease: "power3.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });

  /* ---------- Refresh after fonts load (avoids layout-shift jank) ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
