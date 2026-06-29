/* ============================================================
   The Innovation Department — animations
   Lenis (smooth scroll) + GSAP / ScrollTrigger
   ============================================================ */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-ready");

  /* ---------- Theme (light / dark) ----------
     The inline <head> script + CSS already paint the right colors. Here we
     swap the monochrome wordmark/logo SVGs (_b ⇄ _w), keep the footer toggle
     in sync, persist an explicit choice, and follow the system when none is set. */
  (function theme() {
    const root = document.documentElement;
    const toggle = document.getElementById("themeToggle");
    const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const themed = document.querySelectorAll(".brand-logo, .hero-title .word");
    const themedExplicit = document.querySelectorAll("[data-src-light][data-src-dark]");

    function resolved() {
      const set = root.getAttribute("data-theme");
      if (set === "dark" || set === "light") return set;
      return darkMedia.matches ? "dark" : "light";
    }
    function swapImages(mode) {
      // Wordmarks / logo follow the _b (black) ⇄ _w (white) filename convention.
      const from = mode === "dark" ? "_b." : "_w.";
      const to = mode === "dark" ? "_w." : "_b.";
      themed.forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.indexOf(from) !== -1) img.setAttribute("src", src.replace(from, to));
      });
      // Images with bespoke names (e.g. "Let's talk!") carry per-theme srcs.
      themedExplicit.forEach((img) => {
        const src = img.getAttribute(mode === "dark" ? "data-src-dark" : "data-src-light");
        if (src) img.setAttribute("src", src);
      });
    }
    function apply(mode) {
      swapImages(mode);
      if (toggle) {
        const isDark = mode === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      }
    }

    apply(resolved());

    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = resolved() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        apply(next);
      });
    }

    // When the user hasn't made an explicit choice, track the system setting live.
    darkMedia.addEventListener("change", () => {
      if (!root.getAttribute("data-theme")) apply(resolved());
    });
  })();

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
      // #top is the fixed header (always at viewport top), so scrolling to the
      // element is a no-op — send the page to absolute 0 instead.
      if (id === "#top") {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
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
        if (t === active) t.a.setAttribute("aria-current", "true");
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

  /* ---------- Hero paint-brush cursor trail ----------
     A single-color coral stroke that follows the cursor: tightly-spaced dabs
     laid exactly on the path, melted into one continuous ribbon by the SVG
     gooey filter, fading in place like wet paint. Slower movement lays a
     thicker stroke and fast movement tapers thinner (brush pressure).
     Independent of GSAP; skipped for reduced-motion. */
  (function paintTrail() {
    if (reduceMotion) return;
    const hero = document.querySelector(".hero");
    const trail = hero && hero.querySelector(".sand-trail");
    if (!trail) return;

    const STEP = 6; // px between dabs along the path — small = one continuous ribbon
    const cs = getComputedStyle(document.documentElement);
    // Use the theme's foreground (--ink): black in light mode, cream-white in dark.
    function brushColor() { return cs.getPropertyValue("--ink").trim() || "#1C1A17"; }
    let color = brushColor();
    let lastX = null, lastY = null;

    // One soft round dab of paint at (x, y), fading and gently shrinking in place.
    function dab(x, y, size) {
      const el = document.createElement("span");
      el.className = "sand-cell";
      el.style.cssText =
        `left:${x - size / 2}px;top:${y - size / 2}px;` +
        `width:${size}px;height:${size}px;background:${color};`;
      trail.appendChild(el);
      const anim = el.animate(
        [
          { opacity: 0.9, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.6)" },
        ],
        { duration: 1100, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
      );
      anim.onfinish = () => el.remove();
    }

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      color = brushColor(); // keep the stroke in sync if the theme was toggled
      if (lastX === null) { lastX = x; lastY = y; dab(x, y, 28); return; }
      const dxp = x - lastX, dyp = y - lastY;
      const dist = Math.hypot(dxp, dyp);
      // Brush pressure: a slow drag lays a fat stroke; a fast flick tapers thin.
      const size = Math.max(14, 36 - dist * 0.55);
      // Lay a continuous run of dabs along the exact path travelled this frame.
      const n = Math.min(Math.max(1, Math.round(dist / STEP)), 60);
      for (let i = 1; i <= n; i++) dab(lastX + (dxp * i) / n, lastY + (dyp * i) / n, size);
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
  //   data-video       -> autoplaying, muted, looping clip (one or more comma-separated sources)
  //   data-img + data-img-hover   -> still that cross-fades to a second image on hover
  //   data-img + data-video-hover -> still that cross-fades to a looping clip on hover
  //   data-img only    -> single still
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

    // Looping clip that cross-fades in (and plays) only while hovered. Reuses
    // the .work-thumb-hover opacity machinery; loads lazily (preload="none").
    const hoverVideo = item.getAttribute("data-video-hover");
    if (hoverVideo && !reduceMotion) {
      const video = document.createElement("video");
      video.className = "work-thumb-hover";
      video.muted = true;
      video.loop = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.preload = "none";
      hoverVideo.split(",").forEach((raw) => {
        const src = raw.trim();
        if (!src) return;
        const source = document.createElement("source");
        source.src = src;
        source.type = videoTypeFor(src);
        video.appendChild(source);
      });
      thumb.appendChild(video);
      item.addEventListener("mouseenter", () => {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      });
      item.addEventListener("mouseleave", () => video.pause());
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
  const introTl = gsap.timeline({ delay: 0.15 });
  introTl
    // Script line ("distinctive brands"): sweep the clip open left-to-right so
    // each word appears to be written; "distinctive" first, then "brands".
    .to(".hero-title .word--write", {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 0.85,
      ease: "power1.inOut",
      stagger: 0.5,
    })
    // Serif line ("for unmissable products"): slide up from its clip box.
    .to(
      ".hero-title .line:not(.line--write) > span",
      { y: "0%", duration: 1.1, ease: "expo.out" },
      "-=0.45"
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
