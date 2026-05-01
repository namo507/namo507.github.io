/* CSS-3D interactions: tilt-on-hover, scroll-progress rail, parallax depth.
 * Plain DOM/JS so it runs alongside React without re-renders.
 */
(function () {
  // ── 1. Hover-tilt for cards (perspective rotateX/Y based on cursor) ────────
  function attachTilt(el, max = 8) {
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    function update() {
      raf = 0;
      el.style.transform = `perspective(900px) rotateY(${tx.toFixed(2)}deg) rotateX(${ty.toFixed(2)}deg) translateZ(0)`;
    }
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tx = (px - 0.5) * max * 2;
      ty = -(py - 0.5) * max * 2;
      if (!raf) raf = requestAnimationFrame(update);
    });
    el.addEventListener("mouseleave", () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(update);
    });
    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";
    el.style.transition = "transform 0.25s cubic-bezier(.16,.84,.44,1)";
  }

  function applyTilts() {
    const sels = [".card", ".project", ".repo", ".metric", ".skill", ".contact-card"];
    sels.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.dataset.tilt) return;
        el.dataset.tilt = "1";
        attachTilt(el, sel === ".contact-card" ? 4 : (sel === ".project" ? 10 : 7));
      });
    });
  }

  // ── 2. Scroll-progress rail (vertical 3D segmented bar w/ section dots) ────
  function buildRail() {
    if (document.getElementById("rail-3d")) return;
    const rail = document.createElement("div");
    rail.id = "rail-3d";
    rail.innerHTML = `
      <div class="rail-3d__tube">
        <div class="rail-3d__fill"></div>
        <div class="rail-3d__cursor"></div>
      </div>
      <div class="rail-3d__dots"></div>
      <div class="rail-3d__pct">0%</div>
    `;
    document.body.appendChild(rail);

    const sectionIds = ["home","cv","publications","projects","github","talks","teaching","contact"];
    const dotsWrap = rail.querySelector(".rail-3d__dots");
    sectionIds.forEach((id, i) => {
      const d = document.createElement("button");
      d.className = "rail-3d__dot";
      d.dataset.id = id;
      d.title = id;
      d.style.top = `${(i / (sectionIds.length - 1)) * 100}%`;
      d.addEventListener("click", () => {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
      });
      dotsWrap.appendChild(d);
    });

    const fill = rail.querySelector(".rail-3d__fill");
    const cursor = rail.querySelector(".rail-3d__cursor");
    const pct = rail.querySelector(".rail-3d__pct");
    const dots = [...dotsWrap.querySelectorAll(".rail-3d__dot")];

    function onScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      fill.style.height = `${t * 100}%`;
      cursor.style.top = `${t * 100}%`;
      pct.textContent = `${Math.round(t * 100)}%`;

      const yTarget = window.scrollY + window.innerHeight * 0.4;
      let activeIdx = 0;
      sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= yTarget) activeIdx = i;
      });
      dots.forEach((d, i) => d.classList.toggle("active", i === activeIdx));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ── 3. Parallax depth on hero copy + ribbon (translateZ via scroll) ────────
  function attachParallax() {
    const hero = document.querySelector("#home .hero");
    if (!hero || hero.dataset.parallax) return;
    hero.dataset.parallax = "1";
    hero.style.perspective = "1200px";
    const left = hero.children[0];
    const right = hero.children[1];
    if (left) left.style.transformStyle = "preserve-3d";
    if (right) right.style.transformStyle = "preserve-3d";

    function onScroll() {
      const sy = window.scrollY;
      // shift hero copy backwards as you scroll (subtle 3D dolly out)
      if (left) left.style.transform = `translateZ(${-sy * 0.18}px) translateY(${sy * 0.12}px)`;
      if (right) right.style.transform = `translateZ(${-sy * 0.32}px) translateY(${sy * 0.18}px) rotateY(${sy * 0.04}deg)`;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ── 4. Floating "section number" 3D plate that follows scroll ──────────────
  function buildSectionStamp() {
    if (document.getElementById("section-stamp")) return;
    const stamp = document.createElement("div");
    stamp.id = "section-stamp";
    stamp.innerHTML = `
      <div class="stamp__face">
        <div class="stamp__num">00</div>
        <div class="stamp__label">HOME</div>
      </div>
    `;
    document.body.appendChild(stamp);

    const sectionMap = [
      ["home", "00", "HOME"],
      ["cv", "01", "CV"],
      ["publications", "02", "PUBLICATIONS"],
      ["projects", "03", "PROJECTS"],
      ["github", "04", "GITHUB"],
      ["talks", "05", "TALKS"],
      ["teaching", "06", "TEACHING"],
      ["contact", "07", "CONTACT"],
    ];
    const numEl = stamp.querySelector(".stamp__num");
    const labelEl = stamp.querySelector(".stamp__label");
    const faceEl = stamp.querySelector(".stamp__face");

    let prevIdx = -1;
    function onScroll() {
      const yTarget = window.scrollY + window.innerHeight * 0.4;
      let idx = 0;
      sectionMap.forEach((m, i) => {
        const el = document.getElementById(m[0]);
        if (el && el.offsetTop <= yTarget) idx = i;
      });
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      faceEl.style.transform = `rotateY(${t * 360 * 0.6}deg) rotateX(${Math.sin(t * Math.PI * 2) * 8}deg)`;
      if (idx !== prevIdx) {
        prevIdx = idx;
        numEl.textContent = sectionMap[idx][1];
        labelEl.textContent = sectionMap[idx][2];
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ── 5. Reveal-with-3D-flip for cards as they enter viewport ────────────────
  function attach3DReveal() {
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => {
      if (el.dataset.r3d) return;
      el.dataset.r3d = "1";
      el.classList.add("reveal-3d");
    });
  }

  // ── 6. Dynamic dimmer: as user scrolls into text-heavy sections, boost the
  //     readability scrim so 3D bg recedes; at hero, the scrim is light.
  function attachDimmer() {
    let dim = document.getElementById("bg-dimmer");
    if (!dim) {
      dim = document.createElement("div");
      dim.id = "bg-dimmer";
      Object.assign(dim.style, {
        position: "fixed", inset: "0", zIndex: "1",
        pointerEvents: "none",
        background: "rgba(6,7,12,0)",
        transition: "background 0.4s ease",
      });
      document.body.appendChild(dim);
    }
    const heavy = ["cv","publications","projects","github","talks","teaching"];
    function onScroll() {
      const yTarget = window.scrollY + window.innerHeight * 0.4;
      let inHeavy = false;
      heavy.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.offsetTop, bot = top + el.offsetHeight;
        if (yTarget >= top && yTarget <= bot) inHeavy = true;
      });
      dim.style.background = inHeavy ? "rgba(6,7,12,0.55)" : "rgba(6,7,12,0.18)";
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // initial pass + observe DOM mutations so React-rendered cards get caught
  function bootstrap() {
    applyTilts();
    buildRail();
    attachParallax();
    buildSectionStamp();
    attach3DReveal();
    attachDimmer();
  }

  // wait for React paint
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(bootstrap, 80);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(bootstrap, 80));
  }

  // re-apply on mutations (project filter changes, lazy renders, etc)
  const mo = new MutationObserver(() => {
    applyTilts();
    attach3DReveal();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  window.INTERACT3D = { applyTilts, buildRail, attachParallax, buildSectionStamp };
})();
