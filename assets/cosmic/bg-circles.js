// Cosmic / sprite-circle background animation system.
// Renders a layered field of orbiting circles whose palette + motion respond
// to the active section. Uses canvas + requestAnimationFrame.
// Palette is "dynamic": each section flips hue rotation, scale, and accent.

(function () {
  const SECTION_PALETTES = {
    home:         { hues: [185, 205, 250, 320],  base: "#0b0c12", accent: "#69d7c3", title: "HOME" },
    cv:           { hues: [40, 25, 200, 280],    base: "#0c0a14", accent: "#f1b76a", title: "CV" },
    publications: { hues: [220, 280, 320, 180],  base: "#0a0d18", accent: "#8fb6ff", title: "PUBLICATIONS" },
    projects:     { hues: [150, 190, 60, 320],   base: "#0a1110", accent: "#9ed9c5", title: "PROJECTS" },
    github:       { hues: [260, 300, 180, 90],   base: "#0d0a18", accent: "#c8a4ff", title: "GITHUB" },
    talks:        { hues: [10, 340, 50, 280],    base: "#150c10", accent: "#ff8a9b", title: "TALKS" },
    teaching:     { hues: [80, 120, 180, 40],    base: "#0c1209", accent: "#bcd86c", title: "TEACHING" },
    contact:      { hues: [200, 250, 30, 320],   base: "#08101a", accent: "#7ad6ff", title: "CONTACT" },
  };

  let canvas, ctx, w, h, dpr;
  let sprites = [];
  let state = { section: "home", t: 0, pointerX: 0.5, pointerY: 0.5, paletteT: 0, prev: "home" };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeSprites(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: rand(0, 1), y: rand(0, 1),
        r: rand(0.012, 0.18),         // radius as fraction of min(w,h)
        speed: rand(0.02, 0.18),      // orbit speed
        phase: rand(0, Math.PI * 2),
        drift: rand(0.005, 0.04),     // pos drift amount
        hueIdx: i % 4,
        op: rand(0.06, 0.55),
        ring: Math.random() < 0.35,   // outline-only ring
        twinkle: rand(0.5, 1.6),
        depth: rand(0.2, 1.0),        // parallax
      });
    }
    return arr;
  }

  // Smoothly mix two palettes
  function mixPalette(a, b, t) {
    const mh = (x, y) => x + (y - x) * t;
    return {
      hues: a.hues.map((hv, i) => mh(hv, b.hues[i])),
      base: t < 0.5 ? a.base : b.base,
      accent: t < 0.5 ? a.accent : b.accent,
      title: t < 0.5 ? a.title : b.title,
    };
  }

  function draw(now) {
    const dt = Math.min(0.05, (now - (draw._last || now)) / 1000);
    draw._last = now;
    state.t += dt;
    state.paletteT = Math.min(1, state.paletteT + dt * 1.6);

    const pa = SECTION_PALETTES[state.prev] || SECTION_PALETTES.home;
    const pb = SECTION_PALETTES[state.section] || SECTION_PALETTES.home;
    const pal = mixPalette(pa, pb, state.paletteT);

    // background gradient base
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(
      w * (0.3 + state.pointerX * 0.4), h * (0.3 + state.pointerY * 0.4),
      Math.min(w, h) * 0.05,
      w * 0.5, h * 0.5,
      Math.max(w, h) * 0.9
    );
    g.addColorStop(0, `hsl(${pal.hues[0]}, 55%, 16%)`);
    g.addColorStop(0.55, pal.base);
    g.addColorStop(1, "#040509");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // grid lines (very faint)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    const minDim = Math.min(w, h);

    // Two layers of sprites — back (bigger/blurrier) and front (smaller, sharper)
    for (const s of sprites) {
      const orbit = state.t * s.speed + s.phase;
      const cx = (s.x + Math.cos(orbit) * s.drift + (state.pointerX - 0.5) * 0.04 * s.depth) * w;
      const cy = (s.y + Math.sin(orbit * 1.1) * s.drift + (state.pointerY - 0.5) * 0.04 * s.depth) * h;
      const rr = s.r * minDim * (0.9 + 0.1 * Math.sin(state.t * s.twinkle + s.phase));
      const hue = pal.hues[s.hueIdx];
      const sat = 65;
      const light = 55 + 8 * Math.sin(state.t * s.twinkle + s.phase);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (s.ring) {
        ctx.globalAlpha = s.op * 0.9;
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        ctx.lineWidth = Math.max(0.6, rr * 0.025);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();

        // tiny dashed inner ring for texture
        ctx.globalAlpha = s.op * 0.45;
        ctx.setLineDash([rr * 0.18, rr * 0.18]);
        ctx.beginPath();
        ctx.arc(cx, cy, rr * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        rg.addColorStop(0,   `hsla(${hue}, ${sat}%, ${light + 12}%, ${s.op})`);
        rg.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light}%, ${s.op * 0.45})`);
        rg.addColorStop(1,   `hsla(${hue}, ${sat}%, ${light - 10}%, 0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Massive section title behind content (text-as-sprite).
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = pal.accent;
    const fs = Math.min(w * 0.18, 280);
    ctx.font = `900 ${fs}px "Space Grotesk", "Helvetica Neue", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const wobble = Math.sin(state.t * 0.4) * 6;
    ctx.fillText(pal.title, w / 2, h * 0.5 + wobble);
    ctx.restore();

    // Vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    sprites = makeSprites(48);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (e) => {
      state.pointerX = e.clientX / window.innerWidth;
      state.pointerY = e.clientY / window.innerHeight;
    });
    requestAnimationFrame(draw);
  }

  window.BG = {
    setSection(name) {
      if (name === state.section) return;
      state.prev = state.section;
      state.section = name;
      state.paletteT = 0;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
