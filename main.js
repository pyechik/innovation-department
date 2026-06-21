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

  /* ---------- Marquee: continuous loop + scroll-velocity nudge ---------- */
  const track = document.querySelector(".marquee-track");
  if (track) {
    const loop = gsap.to(track, {
      xPercent: -50,
      repeat: -1,
      duration: 26,
      ease: "none",
    });
    // speed up slightly with scroll velocity
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = 1 + Math.min(Math.abs(self.getVelocity() / 1200), 3);
        gsap.to(loop, { timeScale: v, duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 0.8, delay: 0.3, overwrite: false });
      },
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
