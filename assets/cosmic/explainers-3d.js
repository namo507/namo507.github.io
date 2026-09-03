/* Per-section 3D "explainer" scenes.
 *
 * The redesign drops the old full-screen particle field (three-scene.js) in
 * favour of small, self-contained scenes anchored to each section heading. Each
 * mount point is a `[data-scene="<kind>"]` element; app.jsx renders them and
 * calls `window.Explainers3D.mount()` once React has committed.
 *
 * Rendering strategy: ONE WebGL context for the whole page. A single fixed
 * canvas sits behind `main` (which is transparent apart from its cards), and
 * every frame each registered element is drawn into its own scissored viewport
 * at that element's current screen rect. Ten mount points would otherwise mean
 * ten WebGL contexts, which browsers cap at roughly sixteen per page.
 *
 * Loaded as a module by index.html after `window.THREE` is set.
 */

const THREE = window.THREE;

const KINDS = ["globe", "helix", "lattice", "stack", "rings", "cubes", "wave"];

const state = {
  ready: false,
  calm: false,
  reduced: false,
  entries: [],
  renderer: null,
  canvas: null,
  raf: 0,
  accent: new THREE.Color(0x8b93ff),
};

// ── helpers ─────────────────────────────────────────────────────────────────
function readAccent() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  if (!raw) return;
  try {
    state.accent.set(raw);
  } catch (e) {
    /* non-parseable custom property: keep the previous colour */
  }
}

function material(opts) {
  return new THREE.PointsMaterial(
    Object.assign({ color: state.accent, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.9 }, opts)
  );
}

function lineMaterial(opacity) {
  return new THREE.LineBasicMaterial({ color: state.accent, transparent: true, opacity: opacity });
}

function pointsFrom(positions, opts) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geo, material(opts));
}

// ── scene builders ──────────────────────────────────────────────────────────
// Every builder returns { group, update(t) } and draws inside a ~2-unit cube so
// one shared camera distance frames them all consistently.
const BUILDERS = {
  // A point-sampled sphere with a wireframe shell: "global coverage".
  globe(group) {
    const pts = [];
    const count = 900;
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere keeps the sampling even, no polar clustering.
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      pts.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
    }
    const cloud = pointsFrom(pts, { size: 0.028, opacity: 0.85 });
    const shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.005, 1)),
      lineMaterial(0.22)
    );
    // A tilted orbit ring: reads as coverage/reach beyond the sphere, and gives
    // the hero globe a silhouette wider than the portrait sitting in front.
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.34, 0.006, 6, 160),
      new THREE.MeshBasicMaterial({ color: state.accent.clone(), transparent: true, opacity: 0.42, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 3;
    group.add(cloud, shell, ring);
    return (t) => {
      group.rotation.y = t * 0.18;
      group.rotation.x = Math.sin(t * 0.12) * 0.16;
    };
  },

  // Two counter-phase strands with rungs: sequential / paired records.
  helix(group) {
    const strands = [[], []];
    const rungs = [];
    const turns = 3;
    const steps = 130;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const a = p * Math.PI * 2 * turns;
      const y = (p - 0.5) * 2.1;
      const r = 0.52;
      const ax = Math.cos(a) * r, az = Math.sin(a) * r;
      const bx = Math.cos(a + Math.PI) * r, bz = Math.sin(a + Math.PI) * r;
      strands[0].push(ax, y, az);
      strands[1].push(bx, y, bz);
      if (i % 8 === 0) rungs.push(ax, y, az, bx, y, bz);
    }
    strands.forEach((s) => group.add(pointsFrom(s, { size: 0.036 })));
    const rungGeo = new THREE.BufferGeometry();
    rungGeo.setAttribute("position", new THREE.Float32BufferAttribute(rungs, 3));
    group.add(new THREE.LineSegments(rungGeo, lineMaterial(0.28)));
    return (t) => {
      group.rotation.y = t * 0.4;
    };
  },

  // Regular 3D grid: the sampling frame / design space.
  lattice(group) {
    const pts = [];
    const n = 5;
    const gap = 0.42;
    const off = ((n - 1) * gap) / 2;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          pts.push(x * gap - off, y * gap - off, z * gap - off);
        }
      }
    }
    group.add(pointsFrom(pts, { size: 0.042 }));
    group.add(new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.BoxGeometry(1.85, 1.85, 1.85)),
      lineMaterial(0.18)
    ));
    return (t) => {
      group.rotation.y = t * 0.25;
      group.rotation.x = 0.42 + Math.sin(t * 0.2) * 0.1;
    };
  },

  // Offset stacked planes: layered publications.
  stack(group) {
    for (let i = 0; i < 5; i++) {
      const plate = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.PlaneGeometry(1.4 - i * 0.08, 1.0 - i * 0.06)),
        lineMaterial(0.5 - i * 0.07)
      );
      plate.position.y = (i - 2) * 0.26;
      plate.rotation.x = -Math.PI / 2.6;
      plate.userData.phase = i * 0.5;
      group.add(plate);
    }
    return (t) => {
      group.rotation.y = t * 0.3;
      group.children.forEach((c) => {
        c.position.x = Math.sin(t * 0.6 + c.userData.phase) * 0.09;
      });
    };
  },

  // Concentric tilted rings: nested competencies.
  rings(group) {
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, 0.45 + i * 0.22, 0.45 + i * 0.22, 0, Math.PI * 2).getPoints(96)
        ),
        lineMaterial(0.55 - i * 0.09)
      );
      ring.rotation.x = Math.PI / 2.4 + i * 0.16;
      ring.rotation.z = i * 0.35;
      ring.userData.spin = 0.22 + i * 0.09;
      group.add(ring);
    }
    return (t) => {
      group.children.forEach((c) => { c.rotation.z = t * c.userData.spin; });
      group.rotation.y = Math.sin(t * 0.18) * 0.35;
    };
  },

  // Loose cluster of wireframe cubes: repositories.
  cubes(group) {
    const spots = [
      [0, 0, 0, 0.62], [0.72, 0.34, -0.2, 0.4], [-0.66, -0.3, 0.24, 0.44],
      [0.28, -0.72, 0.3, 0.34], [-0.34, 0.7, 0.18, 0.3],
    ];
    spots.forEach(([x, y, z, s], i) => {
      const cube = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.BoxGeometry(s, s, s)),
        lineMaterial(0.6 - i * 0.08)
      );
      cube.position.set(x, y, z);
      cube.userData.spin = 0.2 + i * 0.13;
      group.add(cube);
    });
    return (t) => {
      group.rotation.y = t * 0.22;
      group.children.forEach((c) => {
        c.rotation.x = t * c.userData.spin * 0.6;
        c.rotation.y = t * c.userData.spin;
      });
    };
  },

  // Travelling sine surface: a signal over time.
  wave(group) {
    const n = 26;
    const span = 1.9;
    const base = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        base.push((i / (n - 1) - 0.5) * span, 0, (j / (n - 1) - 0.5) * span);
      }
    }
    const cloud = pointsFrom(base, { size: 0.032 });
    cloud.rotation.x = -0.5;
    group.add(cloud);
    const attr = cloud.geometry.getAttribute("position");
    return (t) => {
      for (let k = 0; k < attr.count; k++) {
        const x = attr.getX(k), z = attr.getZ(k);
        attr.setY(k, Math.sin(x * 3 + t * 1.4) * 0.16 + Math.cos(z * 2.6 - t * 1.1) * 0.13);
      }
      attr.needsUpdate = true;
      group.rotation.y = Math.sin(t * 0.15) * 0.3;
    };
  },
};

// ── engine ──────────────────────────────────────────────────────────────────
function ensureRenderer() {
  if (state.renderer) return true;

  const canvas = document.createElement("canvas");
  canvas.id = "explainer-canvas";
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "0",
    pointerEvents: "none",
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    // No WebGL (blocked, software-blacklisted, or headless): the layout is
    // designed to read fine without the scenes, so bow out silently.
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.setScissorTest(true);

  document.body.prepend(canvas);
  state.canvas = canvas;
  state.renderer = renderer;

  window.addEventListener("resize", onResize, { passive: true });
  return true;
}

function onResize() {
  if (!state.renderer) return;
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.renderer.setSize(window.innerWidth, window.innerHeight, false);
}

function register(el) {
  const kind = el.getAttribute("data-scene");
  if (!KINDS.includes(kind)) return;

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);
  const update = BUILDERS[kind](group);

  // The camera frames a ~2-unit object across the viewport's SHORT axis. A wide
  // mount point (the hero, whose box is much wider than the portrait it sits
  // behind) would otherwise render its object no larger than the box's height,
  // leaving it hidden behind the foreground card. `data-scene-zoom` pulls the
  // camera in for those, so the object bleeds past the element as intended.
  const zoom = Math.max(1, parseFloat(el.getAttribute("data-scene-zoom")) || 1);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.2 / zoom);

  const entry = { el, scene, camera, group, update, visible: false };
  state.entries.push(entry);

  // Only animate what is actually on screen.
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { entry.visible = e.isIntersecting; }), {
      rootMargin: "10% 0px",
    });
    io.observe(el);
  } else {
    entry.visible = true;
  }

  el.setAttribute("data-scene-mounted", "1");
}

function frame(nowMs) {
  state.raf = requestAnimationFrame(frame);
  const renderer = state.renderer;
  if (!renderer) return;

  const t = (nowMs / 1000) * (state.calm ? 0.35 : 1);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  renderer.clear();

  for (const entry of state.entries) {
    if (!entry.visible || !entry.el.isConnected) continue;
    const r = entry.el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;

    if (!state.reduced) entry.update(t);

    // WebGL's origin is bottom-left; DOM rects are top-left.
    const bottom = vh - r.bottom;
    renderer.setViewport(r.left, bottom, r.width, r.height);
    renderer.setScissor(r.left, bottom, r.width, r.height);
    entry.camera.aspect = r.width / r.height;
    entry.camera.updateProjectionMatrix();
    renderer.render(entry.scene, entry.camera);
  }
}

function applyAccent() {
  readAccent();
  state.entries.forEach((entry) => {
    entry.group.traverse((obj) => {
      if (obj.material && obj.material.color) obj.material.color.copy(state.accent);
    });
  });
}

// ── public API ──────────────────────────────────────────────────────────────
const Explainers3D = {
  mount() {
    if (!THREE) return;
    state.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ensureRenderer()) return;

    readAccent();
    document.querySelectorAll("[data-scene]:not([data-scene-mounted])").forEach(register);

    if (!state.ready) {
      state.ready = true;
      // Re-tint when the visitor flips the theme toggle.
      new MutationObserver(applyAccent).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      state.raf = requestAnimationFrame(frame);
    }
  },

  setCalm(calm) {
    state.calm = !!calm;
  },

  dispose() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    window.removeEventListener("resize", onResize);
    if (state.renderer) state.renderer.dispose();
    if (state.canvas && state.canvas.parentNode) state.canvas.parentNode.removeChild(state.canvas);
    state.renderer = null;
    state.canvas = null;
    state.entries = [];
    state.ready = false;
  },
};

window.Explainers3D = Explainers3D;

export default Explainers3D;
