/* ==========================================================================
   The world: one fixed WebGL canvas behind the page.
   - Background: quiet tracer agents (./tracers.ts) drawing thin, fading lines
     on an invisible grid across the whole screen. On load, and again when the
     cards fly off, a blast of the same lines branches out from behind the strip.
   - Hero: stack cards glide along one long, wide curve and fly off on scroll.
   ========================================================================== */
import * as THREE from 'three';
import { wheelCards } from '../../data/cards';
import { drawCard, drawCardBack, drawShadow, CARD_H, CARD_W } from './card-art';
import { profile } from '../../data/portfolio';
import { createTracers, type TracerLook } from './tracers';

export type WorldInput = { scrollY: number; velocity: number; mouseX: number; mouseY: number };
export type World = {
  tick(dt: number, time: number): void;
  relayout(): void;
  storm(): void;
  focus(sectionId: string | null): void;
  setPaused(p: boolean): void;
  pickCard(clientX: number, clientY: number): string | null;
  /** Touch screens: which card is under a tap (doesn't change the hover state). */
  cardAt(clientX: number, clientY: number): string | null;
  /** Touch screens: keep this card flipped to its back (null flips it back). */
  pinCard(id: string | null): void;
  /** A finger is dragging the card strip: follow it by dx px (positive = cards move right). */
  dragStrip(dx: number): void;
  /** The finger let go: keep gliding at vx px/s (same direction as dragStrip) and slow down. */
  flingStrip(vx: number): void;
  /** Wheel / trackpad: scroll the strip by d px, eased in (positive = cards move left, like scrollLeft). */
  pushStrip(d: number): void;
  /** Re-read the light/dark theme from <html data-theme> and recolour the scene. */
  setTheme(): void;
};

// Theme colours (unchanged); how strongly the tracer lines show on each.
const THEMES: Record<'light' | 'dark', TracerLook & { shadow: number }> = {
  light: { paper: '#ffffff', ink: '#2a2a2a', accent: '#12a08c', inkA: 0.22, tealA: 0.55, headA: 0.9, shadow: 0.32 },
  dark: { paper: '#0e0e0e', ink: '#dcdcdc', accent: '#12a08c', inkA: 0.2, tealA: 0.6, headA: 0.95, shadow: 0.7 },
};
const PAPER = new THREE.Color(THEMES.light.paper);

/* ---------- Helpers ---------- */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const damp = (cur: number, target: number, lambda: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/* ==========================================================================
   createWorld
   ========================================================================== */
export async function createWorld(opts: {
  canvas: HTMLCanvasElement;
  input: WorldInput;
  reduced: boolean;
  mobile: boolean;
  photo?: string;
}): Promise<World> {
  const { canvas, input, reduced, mobile } = opts;
  const rand = rng(7);

  // Card textures need the web fonts.
  try {
    await Promise.all([
      document.fonts.load('900 64px "Unbounded Variable"'),
      document.fonts.load('600 20px "Unbounded Variable"'),
      document.fonts.load('500 20px "JetBrains Mono Variable"'),
      document.fonts.load('500 26px "Space Grotesk Variable"'),
    ]);
  } catch { /* draw with fallbacks */ }
  const photo = await loadImage(opts.photo ?? '');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(PAPER, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 120);
  const HERO_CAM = new THREE.Vector3(0, 0, 10);
  camera.position.copy(HERO_CAM);

  /* ---------- Background: tracer agents ---------- */
  const tracers = createTracers({ mobile, seed: rand });
  scene.add(tracers.mesh);

  /* ---------- Hero: stack cards gliding right → left on a gentle curve ---------- */
  // `hero` sits at the top of the curve, in the band under the name.
  const hero = new THREE.Group();
  scene.add(hero);

  // Cards
  const wheel = new THREE.Group();
  hero.add(wheel);
  const shadowTex = new THREE.CanvasTexture(drawShadow());
  const cardGeo = new THREE.PlaneGeometry(1, CARD_H / CARD_W);
  const shadowGeo = new THREE.PlaneGeometry(1.45, (CARD_H / CARD_W) * 1.3);
  // Each card has a front and a back (it flips on hover). `face` turns; `hit` is an invisible, non-turning
  // plane used for hover picking, so the hover isn't lost while the card is edge-on mid-flip.
  type Card = {
    id: string; pivot: THREE.Group; holder: THREE.Group; face: THREE.Group; mesh: THREE.Mesh; hit: THREE.Mesh;
    mat: THREE.MeshBasicMaterial; backMat: THREE.MeshBasicMaterial; shadow: THREE.Mesh; hover: number; flip: number;
  };
  const cards: Card[] = [];
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const about = { headline: profile.headline, text: profile.aboutShort, keywords: profile.keywords, foot: `${profile.locality}, India · Open to GCC` };
  const cardTex = (cv: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };
  const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  const touchUI = !matchMedia('(hover: hover) and (pointer: fine)').matches; // phones: flipped cards grow less
  wheelCards.forEach((spec, i) => {
    const tex = cardTex(drawCard(spec, i, wheelCards.length, spec.motif === 'profile' ? photo : null));
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.FrontSide });
    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.userData.id = spec.id;
    mesh.renderOrder = 7;
    const backMat = new THREE.MeshBasicMaterial({
      map: cardTex(drawCardBack(spec, i, wheelCards.length, spec.motif === 'profile' ? about : undefined)),
      transparent: true, toneMapped: false, side: THREE.FrontSide,
    });
    const back = new THREE.Mesh(cardGeo, backMat);
    back.rotation.y = Math.PI;
    back.renderOrder = 7;
    const face = new THREE.Group();
    face.add(mesh, back);
    const hit = new THREE.Mesh(cardGeo, hitMat);
    const sMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.7 });
    const shadow = new THREE.Mesh(shadowGeo, sMat);
    shadow.position.set(0.06, -0.12, -0.05);
    shadow.renderOrder = 6;
    const holder = new THREE.Group();
    holder.add(shadow, face, hit);
    const pivot = new THREE.Group();
    pivot.add(holder);
    wheel.add(pivot);
    cards.push({ id: spec.id, pivot, holder, face, mesh, hit, mat, backMat, shadow, hover: 0, flip: 0 });
  });

  /* ---------- Layout ---------- */
  const L = {
    W: 1, Hh: 1, wpp: 0.01, halfH: 1, halfW: 1,
    heroH: 1, stripDocX: 0, stripDocY: 0, sag: 60, card: 1, cardPx: 150,
    stepPx: 200, spanPx: 2400, speed: 50,
  };

  function relayout() {
    L.W = canvas.clientWidth || window.innerWidth;
    L.Hh = canvas.clientHeight || window.innerHeight;
    renderer.setSize(L.W, L.Hh, false);
    camera.aspect = L.W / L.Hh;
    camera.fov = L.W / L.Hh < 0.8 ? 46 : 35;
    camera.updateProjectionMatrix();

    L.halfH = HERO_CAM.z * Math.tan((camera.fov * Math.PI) / 360);
    L.halfW = L.halfH * camera.aspect;
    L.wpp = (2 * L.halfH) / L.Hh;

    const sy = window.scrollY;
    const heroEl = document.querySelector<HTMLElement>('[data-hero]');
    L.heroH = heroEl?.offsetHeight ?? L.Hh;
    const narrow = L.W < 820;

    // Card size comes from the CSS strip (so both versions match). The curve's top sits
    // in the middle of the hero's lower band; `sag` = how far it drops at the screen edges.
    const cardEl = document.querySelector<HTMLElement>('.strip__card');
    const cw = cardEl?.offsetWidth || (narrow ? Math.min(L.W * 0.34, 150) : THREE.MathUtils.clamp(L.W * 0.105, 110, 200));
    const ch = cw * (CARD_H / CARD_W);
    L.sag = narrow ? L.W * 0.08 : Math.min(L.W * 0.045, 90);
    const stageR = document.querySelector<HTMLElement>('[data-hero-stage]')?.getBoundingClientRect();
    let apex = stageR ? stageR.top + sy + stageR.height / 2 - L.sag / 2 : L.Hh * 0.7;
    // Desktop: the top of the curve tucks in just under the red "Ai" block, so the
    // lower-left / lower-right text overlaps the cards as little as possible.
    // (Measured with offsets, so the scroll parallax on the name doesn't skew it.)
    const tw = document.querySelector<HTMLElement>('.hero__titlewrap');
    const titleEl = document.querySelector<HTMLElement>('.hero__title');
    if (!narrow && heroEl && tw && titleEl) {
      const titleBottom = heroEl.getBoundingClientRect().top + sy + tw.offsetTop + titleEl.offsetTop + titleEl.offsetHeight;
      const drop = parseFloat(getComputedStyle(titleEl).fontSize) * 0.34;
      apex = titleBottom + drop + 18 + ch / 2;
    }
    L.stripDocX = L.W / 2;
    L.stripDocY = apex;
    // Spacing: a small gap between cards, and the loop is always longer than the
    // screen so the wrap-around point stays off-screen.
    L.stepPx = Math.max(cw * 1.1, (L.W + cw * 2.6) / cards.length);
    L.spanPx = L.stepPx * cards.length;
    L.speed = narrow ? 38 : 52; // px per second
    L.card = cw * L.wpp;
    L.cardPx = ch;

    tracers.resize(L.W, L.Hh);

    // Hero object sizes
    cards.forEach((c) => c.holder.scale.setScalar(L.card));
    needsRender = true;
  }

  /* ---------- Interaction state ---------- */
  let paused = false;
  let needsRender = true;
  let expand = 0;
  let slide = 0; // how far the strip has moved left (px)
  let wheelVel = 0;
  let pace = 1; // slows down while a card is hovered
  const mouse = new THREE.Vector2();
  const camOffset = new THREE.Vector2();
  let hoveredCard: Card | null = null;
  let pinnedId: string | null = null; // touch: a tapped card stays flipped
  const raycaster = new THREE.Raycaster();
  // tracers
  let started = false; // they set out once the loader has gone
  let lastMouseX = input.mouseX, lastMouseY = input.mouseY;
  let cursorIdle = 1e9; // seconds since the pointer last moved
  let blastArmed = false; // the next scroll away from the top blasts again (re-armed back at the top)
  const BLAST = mobile ? 20 : 44; // most branches a scroll blast may grow

  /** Page (document) coordinates → world position on the z = 0 plane. */
  function docToWorld(x: number, y: number, scrollY: number, out: THREE.Vector3) {
    return out.set((x - L.W / 2) * L.wpp, -(y - scrollY - L.Hh / 2) * L.wpp, 0);
  }

  function pickCard(clientX: number, clientY: number): string | null {
    if (expand > 0.25) { hoveredCard = null; return null; }
    const ndc = new THREE.Vector2((clientX / L.W) * 2 - 1, -(clientY / L.Hh) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(cards.filter((c) => c.pivot.visible).map((c) => c.hit), false)[0];
    hoveredCard = hit ? cards.find((c) => c.hit === hit.object) ?? null : null;
    return hoveredCard?.id ?? null;
  }
  function cardAt(clientX: number, clientY: number): string | null {
    if (expand > 0.25) return null;
    const ndc = new THREE.Vector2((clientX / L.W) * 2 - 1, -(clientY / L.Hh) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(cards.filter((c) => c.pivot.visible).map((c) => c.hit), false)[0];
    return hit ? cards.find((c) => c.hit === hit.object)?.id ?? null : null;
  }
  function pinCard(id: string | null) { pinnedId = id; needsRender = true; }

  // Scrolling the strip by hand (finger drag, fling, shift + wheel)
  let dragging = false; // a finger is on the strip: the automatic glide waits
  let glide = 0; // px/s left over from a fling; dies down
  let wheelLeft = 0; // wheel distance not applied yet (px); eased in over a few frames
  function dragStrip(dx: number) { dragging = true; glide = 0; slide -= dx; needsRender = true; }
  function flingStrip(vx: number) { dragging = false; glide = Math.max(-4000, Math.min(4000, -vx)); needsRender = true; }
  function pushStrip(d: number) { wheelLeft += d; needsRender = true; }

  /** Tracers: set out from the card strip once the page is revealed, then keep walking. */
  function runTracers(dt: number, s: number) {
    if (!started) {
      if (!document.documentElement.classList.contains('loaded')) return;
      started = true;
      // from behind the cards when they're on screen; otherwise from the middle of the screen
      const stripOnScreen = L.stripDocY - s > -L.cardPx && L.stripDocY - s < L.Hh + L.cardPx;
      if (stripOnScreen) tracers.start(L.stripDocX, L.stripDocY - s);
      else tracers.start(L.W / 2, L.Hh / 2);
      if (reduced) tracers.settle(6);
    }
    if (reduced) return;
    // the cursor (or a dragging finger) draws them in while it moves, and lets go when it rests
    const moved = input.mouseX !== lastMouseX || input.mouseY !== lastMouseY;
    lastMouseX = input.mouseX; lastMouseY = input.mouseY;
    cursorIdle = moved ? 0 : cursorIdle + dt;
    tracers.update(dt, {
      scrollY: s,
      cursorX: (input.mouseX * 0.5 + 0.5) * L.W,
      cursorY: (0.5 - input.mouseY * 0.5) * L.Hh,
      cursor: cursorIdle < 3,
    });
  }

  /* ---------- Frame ---------- */
  function tick(dt: number, time: number) {
    if (paused && !needsRender) return;
    const t = reduced ? 0 : time;
    const s = input.scrollY;
    runTracers(dt, s);

    // Hero cards fly off as you scroll away
    const targetExpand = reduced ? 0 : smooth(L.heroH * 0.04, L.heroH * 0.85, s);
    expand = reduced ? 0 : damp(expand, targetExpand, 6, dt);
    // the cards start to fly off: another blast from behind them
    if (expand < 0.03) blastArmed = true;
    else if (expand > 0.12 && blastArmed && started && !reduced) {
      blastArmed = false;
      tracers.blast(L.stripDocX, L.stripDocY - s, BLAST);
    }

    // Mouse smoothing → a little camera parallax on the cards
    mouse.x = damp(mouse.x, input.mouseX, 3, dt);
    mouse.y = damp(mouse.y, input.mouseY, 3, dt);
    camOffset.x = damp(camOffset.x, mouse.x * 0.35, 2.5, dt);
    camOffset.y = damp(camOffset.y, mouse.y * 0.22, 2.5, dt);
    camera.position.set(HERO_CAM.x + camOffset.x, HERO_CAM.y + camOffset.y, HERO_CAM.z);
    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, 0);

    // The top of the curve is attached to the page
    docToWorld(L.stripDocX, L.stripDocY, s, hero.position);
    hero.visible = expand < 0.995;

    // Cards glide right → left along a gentle arch; scrolling (either way) speeds them up,
    // hovering (or, on phones, tapping) a card slows the strip right down so it's easy to read.
    wheelVel = damp(wheelVel, Math.min(Math.abs(input.velocity) * 3, 300), 4, dt);
    if (pinnedId && expand > 0.25) pinnedId = null; // scrolled away: let it go
    pace = damp(pace, dragging ? 0 : hoveredCard || pinnedId ? 0.12 : 1, 5, dt);
    const wheelStep = wheelLeft * Math.min(1, dt * 12);
    wheelLeft -= wheelStep;
    glide = damp(glide, 0, 2.5, dt);
    slide += (reduced ? 0 : (L.speed * pace + wheelVel) * dt) + glide * dt + wheelStep;
    wheel.rotation.x = damp(wheel.rotation.x, -mouse.y * 0.04, 3, dt);
    wheel.rotation.y = damp(wheel.rotation.y, mouse.x * 0.04, 3, dt);
    const fly = smooth(0.0, 0.75, expand);
    const fade = 1 - smooth(0.3, 0.7, expand);
    const span = L.spanPx;
    const bend = L.sag / Math.pow(L.W / 2, 2); // y = bend * x² (px, downward)
    cards.forEach((c, i) => {
      // x = card centre in px from the middle of the screen; wraps around off-screen
      const x = ((((i * L.stepPx - slide + span / 2) % span) + span) % span) - span / 2;
      const fromEnd = Math.min(x + span / 2, span / 2 - x);
      const side = i % 2 ? 1 : -1;
      const active = hoveredCard === c || pinnedId === c.id;
      c.hover = damp(c.hover, active ? 1 : 0, 8, dt);
      c.holder.position.set(
        x * L.wpp * (1 + fly * 0.5),
        -bend * x * x * L.wpp + fly * side * L.card * (0.8 + (i % 3) * 0.35) + c.hover * L.card * 0.08,
        fly * 7 * (0.6 + (i % 3) * 0.2) + c.hover * 0.4,
      );
      c.holder.rotation.set(
        reduced ? 0 : Math.cos(t * 0.5 + i) * 0.04,
        (reduced ? 0 : Math.sin(t * 0.6 + i * 1.3) * 0.1) + fly * side * 1.2,
        Math.atan(-2 * bend * x) + fly * side * 0.5, // lean with the curve
      );
      // hover flips the card to its back ("where I've used it") and brings it a little closer
      c.flip = damp(c.flip, active ? 1 : 0, reduced ? 30 : 6, dt);
      const fe = c.flip * c.flip * (3 - 2 * c.flip);
      c.face.rotation.y = fe * Math.PI;
      const sc = 1 + c.hover * 0.06 + fe * (touchUI ? 0.1 : 0.24); // phones: grow less (the hero is tighter)
      c.face.scale.setScalar(sc);
      c.hit.scale.setScalar(sc);
      // fade at both ends of the loop (always off-screen) so the wrap-around never pops
      const o = fade * smooth(0, L.stepPx * 0.5, fromEnd);
      c.mat.opacity = o;
      c.backMat.opacity = o;
      (c.shadow.material as THREE.MeshBasicMaterial).opacity = shadowK * o * (1 - c.hover * 0.3);
      c.pivot.visible = o > 0.01;
    });

    renderer.render(scene, camera);
    needsRender = false;
  }

  let shadowK = THEMES.light.shadow;
  function applyTheme() {
    const th = document.documentElement.dataset.theme === 'dark' ? THEMES.dark : THEMES.light;
    PAPER.set(th.paper);
    renderer.setClearColor(PAPER, 1);
    tracers.setLook(th);
    shadowK = th.shadow;
    needsRender = true;
  }

  relayout();
  applyTheme();

  return {
    tick,
    relayout,
    pickCard,
    cardAt,
    pinCard,
    dragStrip,
    flingStrip,
    pushStrip,
    setTheme: applyTheme,
    storm() { if (!reduced) tracers.blast(L.W / 2, L.Hh / 2, BLAST * 2); },
    focus() { /* the background stays the same in every section */ },
    setPaused(p) { paused = p; if (!p) needsRender = true; },
  };
}
