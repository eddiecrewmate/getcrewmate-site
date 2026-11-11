// GetCrewMate scroll experience. Self-hosted, no third-party requests.
// Without WebGL, or with reduced motion on, the page stays as plain content (html.no3d).
// Scroll hint: fades once the visitor has started scrolling.
const hintEl = document.querySelector('.hint');
if (hintEl) addEventListener('scroll', () => hintEl.classList.toggle('gone', scrollY > 60), { passive: true });

// Peek (founder, 11 Nov 2026): after 2 s with no touch, scroll or key, glide down about a quarter
// of the screen once, so visitors see there is more below. The store buttons stay in view.
// Never with Reduce Motion, never when arriving at a section link or part-way down the page.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash || scrollY > 10) return;
  let off = false;
  const stop = () => { off = true; };
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(e => addEventListener(e, stop, { passive: true, once: true }));
  addEventListener('scroll', () => { if (!peeking && scrollY > 10) off = true; }, { passive: true });
  let peeking = false;
  setTimeout(() => {
    if (off || scrollY > 10) return;
    peeking = true;
    const to = Math.round(innerHeight * 0.25), t0 = performance.now(), dur = 1100;
    const ease = x => 1 - Math.pow(1 - x, 3);
    const step = now => {
      if (off) return;
      const p = Math.min(1, (now - t0) / dur);
      scrollTo(0, Math.round(to * ease(p)));
      if (p < 1) requestAnimationFrame(step); else peeking = false;
    };
    requestAnimationFrame(step);
  }, 2000);
})();
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('plain');
const narrow = () => innerWidth <= 820;

// Film: the vertical cut on phones.
const film = document.getElementById('filmv');
if (film && matchMedia('(max-width: 640px) and (orientation: portrait)').matches) {
  film.querySelector('source').src = 'video/film-9x16.mp4';
  film.poster = 'video/film-poster-v.jpg';
  film.parentElement.classList.add('tall');
  film.load();
}

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

if (!reduced && webglOK()) {
  start().catch(err => {
    console.warn('3D unavailable, showing the plain page.', err);
    root.classList.remove('js3d'); root.classList.add('no3d');
  });
}

async function start() {
  const THREE = await import('three');
  root.classList.remove('no3d'); root.classList.add('js3d');

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 9;
  scene.add(new THREE.AmbientLight(0xbfcbe6, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9a66b, 2.6); rim.position.set(-5, 1, -2); scene.add(rim);

  /* ---------- globe ---------- */
  const globe = new THREE.Group(); scene.add(globe);
  const spin = new THREE.Group(); globe.add(spin);
  const R = 2.2;
  const toV = (lat, lon, r = R) => {
    const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x0f1a30, transparent: true }));
  core.renderOrder = -1;
  spin.add(core);

  const raw = new Int16Array(await (await fetch('data/land.bin')).arrayBuffer());
  const step = narrow() ? 2 : 1;
  const pos = [];
  for (let i = 0; i < raw.length; i += 2 * step) { const v = toV(raw[i] / 100, raw[i + 1] / 100); pos.push(v.x, v.y, v.z); }
  const dotsG = new THREE.BufferGeometry();
  dotsG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const dc = document.createElement('canvas'); dc.width = dc.height = 32;
  const dx = dc.getContext('2d'); dx.fillStyle = '#fff'; dx.beginPath(); dx.arc(16, 16, 14, 0, Math.PI * 2); dx.fill();
  const dotTex = new THREE.CanvasTexture(dc);
  const dotsM = new THREE.PointsMaterial({ color: 0xb4c6ea, size: narrow() ? 0.04 : 0.036, transparent: true, opacity: 0.95, depthWrite: false, map: dotTex, alphaTest: 0.2 });
  const dots = new THREE.Points(dotsG, dotsM); dots.renderOrder = 1; spin.add(dots);

  // Soft glow behind the globe.
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gx = gc.getContext('2d'); const gr = gx.createRadialGradient(128, 128, 40, 128, 128, 128);
  gr.addColorStop(0, 'rgba(76,201,240,.22)'); gr.addColorStop(0.6, 'rgba(76,201,240,.14)'); gr.addColorStop(0.72, 'rgba(76,130,200,.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
  const glowM = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowM); glow.scale.set(R * 3.3, R * 3.3, 1); glow.position.z = -1; globe.add(glow);

  // Illustrative crew routes: decoration only, not live traffic.
  const AP = { ATL: [33.6, -84.4], JFK: [40.6, -73.8], LHR: [51.5, -0.5], LAX: [33.9, -118.4], NRT: [35.8, 140.4], DXB: [25.3, 55.4], GRU: [-23.4, -46.5], MIA: [25.8, -80.3], SYD: [-33.9, 151.2], SIN: [1.4, 104], ORD: [41.9, -87.9], CDG: [49, 2.5] };
  const pairs = [['ATL','JFK'],['JFK','LHR'],['LAX','NRT'],['DXB','LHR'],['GRU','MIA'],['SIN','SYD'],['ORD','CDG'],['ATL','GRU'],['LHR','SIN'],['LAX','JFK']];
  const arcM = new THREE.MeshBasicMaterial({ color: 0xc9a66b, transparent: true, opacity: 0.95, depthWrite: false });
  const headM = new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true });
  const headG = new THREE.SphereGeometry(0.032, 10, 10);
  const arcs = pairs.map(([a, b], i) => {
    const A = toV(...AP[a]), B = toV(...AP[b]);
    const mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(R + 0.12 + A.distanceTo(B) * 0.22);
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const geo = new THREE.TubeGeometry(curve, 64, 0.007, 5, false);
    const mesh = new THREE.Mesh(geo, arcM); mesh.renderOrder = 2;
    const head = new THREE.Mesh(headG, headM); head.renderOrder = 3;
    spin.add(mesh, head);
    return { curve, geo, mesh, head, off: i * 0.13 + (i % 3) * 0.21, speed: 0.07 + (i % 4) * 0.012 };
  });

  /* ---------- phone ---------- */
  const PH = 4.4, PW = PH * 660 / 1434, DEPTH = 0.2, BEZEL = 0.07;
  const rr = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  const phone = new THREE.Group(); scene.add(phone);
  const bodyG = new THREE.ExtrudeGeometry(rr(PW + BEZEL * 2, PH + BEZEL * 2, 0.42), { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 16 });
  bodyG.translate(0, 0, -DEPTH / 2);
  const body = new THREE.Mesh(bodyG, new THREE.MeshStandardMaterial({ color: 0x232c42, metalness: 0.75, roughness: 0.32 }));
  phone.add(body);
  const planeUV = (geo, w, h) => {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return geo;
  };
  const screenG = planeUV(new THREE.ShapeGeometry(rr(PW, PH, 0.36), 16), PW, PH);
  const loader = new THREE.TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = n => { const t = loader.load(`img/${n}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
  const screens = ['commute', 'flight-live', 'lockscreen', 'turbulence', 'toolkit'].map(tex);
  const screen = new THREE.Mesh(screenG, new THREE.MeshBasicMaterial({ map: screens[0], toneMapped: false }));
  screen.position.z = DEPTH / 2 + 0.03; phone.add(screen);
  // Back of the phone: the app icon.
  const iconTex = loader.load('img/icon-192.png'); iconTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(planeUV(new THREE.ShapeGeometry(rr(0.9, 0.9, 0.2), 8), 0.9, 0.9), new THREE.MeshBasicMaterial({ map: iconTex, toneMapped: false }));
  back.rotation.y = Math.PI; back.position.z = -DEPTH / 2 - 0.03; phone.add(back);
  // Side buttons.
  const btnM = new THREE.MeshStandardMaterial({ color: 0x323c56, metalness: 0.8, roughness: 0.3 });
  [[1, 0.75, 0.55], [-1, 1.0, 0.3], [-1, 0.5, 0.42]].forEach(([s, y, h]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, 0.07), btnM);
    b.position.set(s * (PW / 2 + BEZEL + 0.03), y, 0); phone.add(b);
  });

  /* ---------- scroll state ---------- */
  const features = document.getElementById('features');
  const chaps = [...document.querySelectorAll('.chap')];
  const story = document.getElementById('story');
  const beats = [...story.querySelectorAll('.beat')];
  const finalS = document.getElementById('get');
  const clearSections = [...document.querySelectorAll('.clear')];

  let W = 1, H = 1, visW = 1, visH = 1, mobile = narrow();
  function resize() {
    W = innerWidth; H = innerHeight; mobile = narrow();
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360); visW = visH * camera.aspect;
    tick();
  }
  addEventListener('resize', resize);

  let mx = 0, my = 0;
  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  // Story: scenes cross-fade while the stage is pinned.
  function storyFrame() {
    const r = story.getBoundingClientRect();
    const total = r.height - H;
    const p = clamp(-r.top / total) * beats.length;
    beats.forEach((b, i) => {
      const inn = i === 0 ? 1 : smooth(i - 0.18, i + 0.12, p);
      const out = i === beats.length - 1 ? 1 : 1 - smooth(i + 0.82, i + 1.12, p);
      b.style.opacity = Math.min(inn, out);
      b.style.transform = `scale(${1.08 - 0.08 * clamp((p - i + 0.2) / 1.4)})`;
      const cap = b.querySelector('figcaption');
      const c = smooth(i + 0.02, i + 0.22, p);
      cap.style.opacity = i === 0 ? 1 : c;
      cap.style.transform = `translateY(${(1 - (i === 0 ? 1 : c)) * 28}px)`;
    });
  }

  // Smoothed scroll values.
  const S = { enter: 0, exit: 0, final: 0, f: 0 };
  const T = { enter: 0, exit: 0, final: 0, f: 0 };
  function readScroll() {
    const fr = features.getBoundingClientRect();
    T.enter = clamp((H - fr.top) / (H * 0.9));
    T.exit = clamp((H * 0.4 - fr.bottom) / (H * 0.5));
    const fin = finalS.getBoundingClientRect();
    T.final = clamp((H - fin.top) / (H * 0.85));
    let f = 0;
    chaps.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (r.top < H / 2) f = i + clamp((H / 2 - r.top) / r.height);
    });
    T.f = f;
  }

  let shown = 0;
  function tick() {
    const scrollY = window.scrollY;
    const t = performance.now() / 1000;

    // Globe: beside the headline in the hero and final sections, faint and huge behind the phone in between.
    const heroX = mobile ? 0 : visW * 0.25, heroY = mobile ? -visH * 0.47 : -0.1;
    const heroS = mobile ? Math.min(1, visW / 5.6) : Math.min(1, visW / 9.6);
    const midness = S.enter * (1 - S.final);
    globe.position.set(lerp(heroX, 0, midness), lerp(heroY, 0, midness), lerp(0, -5, midness));
    const sc = lerp(heroS, 1.45, midness); globe.scale.setScalar(sc);
    dotsM.opacity = lerp(0.95, 0.32, midness);
    arcM.opacity = lerp(0.95, 0.28, midness);
    headM.opacity = lerp(1, 0.35, midness);
    core.material.opacity = lerp(1, 0.55, midness);
    glowM.opacity = lerp(0.55, 0.12, midness);
    spin.rotation.set(0.32 + my * 0.08, 1.9 + t * 0.035 + scrollY * 0.00035 + mx * 0.15, 0);

    arcs.forEach(a => {
      const p = (t * a.speed + a.off) % 1.25;
      const d = clamp(p);
      a.geo.setDrawRange(0, Math.floor(a.geo.index.count * d));
      a.head.position.copy(a.curve.getPoint(d));
      a.head.visible = p < 1;
      a.mesh.visible = p < 1.2;
    });

    // Phone: rises in, sits opposite the text, does a full turn to change screen.
    const fi = clamp(S.f, 0, chaps.length - 0.0001);
    const idx = Math.floor(fi), frac = fi - idx;
    const flip = idx < chaps.length - 1 ? smooth(0.72, 1, frac) : 0;
    const side = i => (i % 2 === 0 ? 1 : -1);
    const phoneScale = mobile ? Math.min(visH * 0.5 / PH, visW * 0.66 / PW) : Math.min(1, visH * 0.74 / PH);
    const baseX = mobile ? 0 : Math.min(visW * 0.24, 2.9);
    const baseY = mobile ? visH * 0.165 : -visH * 0.03;
    const x = baseX * lerp(side(idx), side(idx + 1), flip);
    const showY = (1 - smooth(0, 1, S.enter)) * -visH * 1.1 + S.exit * visH * 1.2;
    phone.position.set(x, baseY + showY + Math.sin(t * 0.8) * 0.03, 0);
    phone.scale.setScalar(phoneScale);
    const tilt = lerp(side(idx), side(idx + 1), flip) * -0.32;
    phone.rotation.y = tilt + flip * Math.PI * 2 + mx * 0.28 + (1 - S.enter) * -0.9;
    phone.rotation.x = 0.05 + my * 0.12 + Math.sin(t * 0.6) * 0.012;
    phone.rotation.z = (1 - S.enter) * 0.14;
    phone.visible = S.enter > 0.001 && S.exit < 0.999;
    const want = flip > 0.5 ? idx + 1 : idx;
    if (want !== shown && screens[want]) { screen.material.map = screens[want]; screen.material.needsUpdate = true; shown = want; }

    storyFrame();
    renderer.render(scene, camera);
  }

  // Only render while a see-through section is on screen.
  let visible = new Set(), running = false;
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    if (visible.size && !running) { running = true; requestAnimationFrame(loop); }
  }, { rootMargin: '10% 0px' });
  clearSections.forEach(s => io.observe(s));

  function loop() {
    readScroll();
    const k = 0.09;
    for (const key of Object.keys(S)) S[key] += (T[key] - S[key]) * k;
    tick();
    if (visible.size && !document.hidden) requestAnimationFrame(loop); else running = false;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible.size && !running) { running = true; requestAnimationFrame(loop); } });

  // The story is opaque, so it animates on scroll without the 3D loop.
  addEventListener('scroll', () => { if (!running) storyFrame(); }, { passive: true });

  const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(el => rev.observe(el));

  resize();
  storyFrame();
  if (!running) { running = true; requestAnimationFrame(loop); }
}
