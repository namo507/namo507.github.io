/* Three.js scroll-driven 3D scene
 * Replaces 2D bg-circles canvas with a real 3D environment that morphs as you scroll.
 *
 * Each section gets a "shape" (sphere of points, helix, torus knot, ring grid, etc).
 * Particles tween between configurations as you scroll the page; camera dollies + rotates.
 * Mouse parallax adds subtle camera tilt.
 */
(function () {
  const PARTICLE_COUNT = 2400;

  // hide the old 2D canvas if present, then disable its loop
  const oldCanvas = document.getElementById("bg-canvas");
  if (oldCanvas) oldCanvas.style.display = "none";
  if (window.BG && typeof window.BG.disable === "function") window.BG.disable();

  // create a fresh full-screen canvas behind everything
  const canvas = document.createElement("canvas");
  canvas.id = "bg-canvas-3d";
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100vh",
    zIndex: "0", pointerEvents: "none",
  });
  document.body.prepend(canvas);

  const THREE = window.THREE;
  if (!THREE) { console.warn("three.js not loaded"); return; }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0); // transparent

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090f, 0.045);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 14);

  // ── Generate target positions for each "shape" ─────────────────────────────
  function spherePoints(n, R = 7) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const phi = Math.acos(-1 + (2 * i) / n);
      const theta = Math.sqrt(n * Math.PI) * phi;
      out[i*3]   = R * Math.cos(theta) * Math.sin(phi);
      out[i*3+1] = R * Math.sin(theta) * Math.sin(phi);
      out[i*3+2] = R * Math.cos(phi);
    }
    return out;
  }
  function helixPoints(n, R = 4, h = 16) {
    const out = new Float32Array(n * 3);
    const turns = 6;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const strand = i % 2 === 0 ? 0 : Math.PI;
      const a = t * turns * Math.PI * 2 + strand;
      out[i*3]   = R * Math.cos(a);
      out[i*3+1] = (t - 0.5) * h;
      out[i*3+2] = R * Math.sin(a);
    }
    return out;
  }
  function torusKnotPoints(n, R = 5, r = 1.6) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 * 3;
      const p = 2, q = 3;
      const x = (R + r * Math.cos(q * t)) * Math.cos(p * t);
      const y = (R + r * Math.cos(q * t)) * Math.sin(p * t);
      const z = r * Math.sin(q * t);
      // jitter to thicken the curve into a tube of points
      const a = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.6;
      out[i*3]   = x + Math.cos(a) * rad;
      out[i*3+1] = y + Math.cos(a + 1) * rad;
      out[i*3+2] = z + Math.sin(a) * rad;
    }
    return out;
  }
  function gridCubePoints(n, S = 7) {
    const out = new Float32Array(n * 3);
    const cube = Math.ceil(Math.cbrt(n));
    let i = 0;
    for (let x = 0; x < cube && i < n; x++) {
      for (let y = 0; y < cube && i < n; y++) {
        for (let z = 0; z < cube && i < n; z++) {
          out[i*3]   = (x / (cube - 1) - 0.5) * S * 2;
          out[i*3+1] = (y / (cube - 1) - 0.5) * S * 2;
          out[i*3+2] = (z / (cube - 1) - 0.5) * S * 2;
          i++;
        }
      }
    }
    return out;
  }
  function ringPoints(n, rings = 6) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const ring = i % rings;
      const R = 3 + ring * 0.9;
      const a = (i / n) * Math.PI * 2 * 8;
      out[i*3]   = R * Math.cos(a);
      out[i*3+1] = (ring - rings/2) * 0.7 + Math.sin(a*3) * 0.2;
      out[i*3+2] = R * Math.sin(a);
    }
    return out;
  }
  function galaxyPoints(n) {
    const out = new Float32Array(n * 3);
    const arms = 4;
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const arm = i % arms;
      const angle = t * 4 + (arm / arms) * Math.PI * 2;
      const r = 1 + t * 7;
      out[i*3]   = Math.cos(angle) * r + (Math.random() - 0.5) * 0.6;
      out[i*3+1] = (Math.random() - 0.5) * 1.2;
      out[i*3+2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.6;
    }
    return out;
  }
  function waveGridPoints(n) {
    const out = new Float32Array(n * 3);
    const side = Math.ceil(Math.sqrt(n));
    let i = 0;
    for (let x = 0; x < side && i < n; x++) {
      for (let z = 0; z < side && i < n; z++) {
        const px = (x / (side - 1) - 0.5) * 16;
        const pz = (z / (side - 1) - 0.5) * 16;
        out[i*3]   = px;
        out[i*3+1] = Math.sin(px*0.5)*0.6 + Math.cos(pz*0.5)*0.6;
        out[i*3+2] = pz;
        i++;
      }
    }
    return out;
  }

  // section → shape map (in scroll order)
  const SHAPES = [
    { id: "home",         pts: spherePoints(PARTICLE_COUNT, 6.5),    color: 0x69d7c3, rot: 0.05 },
    { id: "cv",           pts: galaxyPoints(PARTICLE_COUNT),         color: 0x8fb6ff, rot: 0.04 },
    { id: "publications", pts: torusKnotPoints(PARTICLE_COUNT),      color: 0xff8a9b, rot: 0.06 },
    { id: "projects",     pts: gridCubePoints(PARTICLE_COUNT, 6.5),  color: 0xf1b76a, rot: 0.03 },
    { id: "github",       pts: ringPoints(PARTICLE_COUNT),           color: 0x7ad6ff, rot: 0.05 },
    { id: "talks",        pts: helixPoints(PARTICLE_COUNT),          color: 0xc8a4ff, rot: 0.07 },
    { id: "teaching",     pts: waveGridPoints(PARTICLE_COUNT),       color: 0xbcd86c, rot: 0.04 },
    { id: "contact",      pts: spherePoints(PARTICLE_COUNT, 5.0),    color: 0x69d7c3, rot: 0.06 },
  ];

  // ── Particle system ─────────────────────────────────────────────────────────
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colorsAttr = new Float32Array(PARTICLE_COUNT * 3);
  // initial positions = first shape
  positions.set(SHAPES[0].pts);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colorsAttr, 3));

  const colA = new THREE.Color(SHAPES[0].color);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    colorsAttr[i*3]   = colA.r;
    colorsAttr[i*3+1] = colA.g;
    colorsAttr[i*3+2] = colA.b;
  }

  // round point sprite via canvas texture
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext("2d");
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTex = new THREE.CanvasTexture(dotCanvas);

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    map: dotTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  // big translucent sphere (planet) behind everything for depth
  const planetGeom = new THREE.IcosahedronGeometry(2.6, 2);
  const planetMat = new THREE.MeshBasicMaterial({
    color: 0x69d7c3, wireframe: true, transparent: true, opacity: 0.08,
  });
  const planet = new THREE.Mesh(planetGeom, planetMat);
  scene.add(planet);

  // soft glowing ring
  const ringGeom = new THREE.TorusGeometry(8, 0.04, 8, 200);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  // ── Scroll progress + interp helpers ────────────────────────────────────────
  const sectionEls = SHAPES.map((s) => document.getElementById(s.id)).filter(Boolean);

  function getScrollProgress() {
    // 0..1 across the whole page; also returns fractional section index
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const sy = Math.min(window.scrollY, max);
    const t = sy / max;
    // also figure out which section we're between
    const tops = sectionEls.map((el) => el.offsetTop);
    let idx = 0;
    const yTarget = window.scrollY + window.innerHeight * 0.45;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= yTarget) idx = i;
    }
    let local = 0;
    if (idx < tops.length - 1) {
      const top = tops[idx];
      const next = tops[idx + 1];
      local = Math.max(0, Math.min(1, (yTarget - top) / Math.max(1, next - top)));
    } else {
      local = 1;
    }
    return { t, idx, local };
  }

  // mouse parallax
  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  // ── Animation loop ──────────────────────────────────────────────────────────
  const tmp = new THREE.Color();
  let camRotY = 0, camRotX = 0;

  function animate(time) {
    const t = time * 0.001;
    const sp = getScrollProgress();
    const fromShape = SHAPES[sp.idx];
    const toShape = SHAPES[Math.min(sp.idx + 1, SHAPES.length - 1)];
    const k = sp.local;

    // morph particles
    const pa = geom.attributes.position.array;
    const ca = geom.attributes.color.array;
    const fp = fromShape.pts, tp = toShape.pts;
    const fc = new THREE.Color(fromShape.color);
    const tc = new THREE.Color(toShape.color);
    tmp.copy(fc).lerp(tc, k);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i*3;
      // small per-particle wobble for life
      const wob = 0.06;
      const ph = (i * 0.013) + t;
      pa[i3]   = fp[i3]   + (tp[i3]   - fp[i3])   * k + Math.sin(ph)     * wob;
      pa[i3+1] = fp[i3+1] + (tp[i3+1] - fp[i3+1]) * k + Math.cos(ph*1.1) * wob;
      pa[i3+2] = fp[i3+2] + (tp[i3+2] - fp[i3+2]) * k + Math.sin(ph*0.9) * wob;
      ca[i3]   = tmp.r;
      ca[i3+1] = tmp.g;
      ca[i3+2] = tmp.b;
    }
    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;

    // group rotation tied to scroll + idle spin
    const rotSpeed = fromShape.rot + (toShape.rot - fromShape.rot) * k;
    points.rotation.y = sp.t * Math.PI * 2 + t * rotSpeed;
    points.rotation.x = Math.sin(sp.t * Math.PI * 2) * 0.4;

    // planet pulse + tint
    planet.rotation.y = t * 0.1;
    planet.rotation.x = t * 0.08;
    planetMat.color.copy(tmp);
    planetMat.opacity = 0.06 + Math.sin(t * 0.6) * 0.02;

    ring.rotation.z = t * 0.08;
    ringMat.color.copy(tmp);

    // camera dolly + parallax — moves further out at section transitions
    const targetZ = 12 + Math.sin(sp.t * Math.PI) * 4 + (1 - Math.abs(k - 0.5) * 2) * 0.5;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camRotY += (mx * 0.25 - camRotY) * 0.05;
    camRotX += (-my * 0.18 - camRotX) * 0.05;
    camera.position.x = Math.sin(camRotY) * 2;
    camera.position.y = Math.sin(camRotX) * 1.5 + (sp.t - 0.5) * 1.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // expose
  window.SCENE3D = { scene, camera, renderer };
})();
