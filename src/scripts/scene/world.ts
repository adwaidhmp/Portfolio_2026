/* ==========================================================================
   The world: one fixed WebGL canvas behind the page.
   - Hero: stack cards glide along one long, wide curve. The network's nodes
     start collapsed (invisible) where the cards are.
   - On scroll the cards fly past the camera and the network bursts out
     ("an agent's mind"). The camera then glides through it,
     past one gold hub node per section, while data packets flow on the edges.
   ========================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { wheelCards } from '../../data/cards';
import { drawCard, drawCardBack, drawShadow, CARD_W, CARD_H } from './card-art';
import { profile } from '../../data/portfolio';

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

// Theme colours (uPaper = background, uInk = node/line colour, uRed = accent).
// These objects are shared by the uniforms, so setTheme() just mutates them.
const THEMES = {
  light: { paper: '#ffffff', ink: '#2a2a2a', accent: '#12a08c', dust: '#b8b8b8', line: 0.16, shadow: 0.32 },
  dark: { paper: '#0e0e0e', ink: '#dcdcdc', accent: '#12a08c', dust: '#5e5e5e', line: 0.13, shadow: 0.7 },
};
const PAPER = new THREE.Color(THEMES.light.paper);
const INK = new THREE.Color(THEMES.light.ink);
const RED = new THREE.Color(THEMES.light.accent);

/* ---------- Shaders ---------- */
const COMMON = /* glsl */ `
  uniform float uTime;
  uniform float uExpand;
  uniform vec3 uHub;
  uniform mat3 uCoreRot;
  uniform float uScale;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vFog;
  vec3 drift(vec3 p, float s) {
    return vec3(
      sin(uTime * 0.35 + s * 12.0 + p.y * 0.3),
      cos(uTime * 0.30 + s * 9.0 + p.x * 0.3),
      sin(uTime * 0.25 + s * 7.0 + p.z * 0.2)
    ) * 0.22;
  }
  // 0 while the network is collapsed (hidden), 1 once the burst starts
  float burst() { return smoothstep(0.0, 0.14, uExpand); }
  vec3 nodePos(vec3 net, vec3 core, float seed) {
    float e = clamp(uExpand * 1.3 - seed * 0.3, 0.0, 1.0);
    e = e * e * (3.0 - 2.0 * e);
    vec3 c = uCoreRot * core + uHub;
    return mix(c, net + drift(net, seed), e);
  }
`;

const NODE_VS = /* glsl */ `
  ${COMMON}
  uniform float uSize;
  attribute vec3 aCore;
  attribute float aSeed;
  attribute float aRed;
  varying float vRed;
  void main() {
    vec3 p = nodePos(position, aCore, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.7 + aSeed * 0.9) * (1.0 + aRed * 0.6);
    gl_PointSize = max(1.5, s * uScale / -mv.z) * burst();
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
    vRed = aRed;
  }
`;
const NODE_FS = /* glsl */ `
  uniform vec3 uInk; uniform vec3 uRed; uniform vec3 uPaper;
  varying float vFog; varying float vRed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.36, d);
    if (a < 0.01) discard;
    vec3 col = mix(uInk, uRed, vRed);
    gl_FragColor = vec4(mix(col, uPaper, vFog), a * (1.0 - vFog * 0.85));
  }
`;

const LINE_VS = /* glsl */ `
  ${COMMON}
  attribute vec3 aCore;
  attribute float aSeed;
  varying float vVis;
  void main() {
    vec3 p = nodePos(position, aCore, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
    vVis = burst();
  }
`;
const LINE_FS = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha; uniform vec3 uPaper;
  varying float vFog; varying float vVis;
  void main() {
    gl_FragColor = vec4(mix(uColor, uPaper, vFog), uAlpha * (1.0 - vFog) * vVis);
  }
`;

const PACKET_VS = /* glsl */ `
  ${COMMON}
  uniform float uSize; uniform float uStorm; uniform float uDensity;
  attribute vec3 aCoreA; attribute float aSeedA;
  attribute vec3 aNetB; attribute vec3 aCoreB; attribute float aSeedB;
  attribute float aOff; attribute float aSpeed; attribute float aRank;
  void main() {
    float t = fract(aOff + uTime * aSpeed * (1.0 + uStorm * 5.0));
    vec3 a = nodePos(position, aCoreA, aSeedA);
    vec3 b = nodePos(aNetB, aCoreB, aSeedB);
    vec4 mv = modelViewMatrix * vec4(mix(a, b, t), 1.0);
    gl_Position = projectionMatrix * mv;
    float show = step(aRank, uDensity + uStorm);
    float s = uSize * mix(0.4, 1.0, uExpand) * (1.0 + uStorm * 0.9) * show * sin(t * 3.14159) * burst();
    gl_PointSize = s * uScale / -mv.z;
    vFog = smoothstep(uFogNear, uFogFar, -mv.z);
  }
`;
const PACKET_FS = /* glsl */ `
  uniform vec3 uRed; uniform vec3 uPaper;
  varying float vFog;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.2, 0.1, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.5;
    float a = max(core, halo);
    if (a < 0.01) discard;
    vec3 col = mix(uRed, vec3(1.0, 0.95, 0.84), core * 0.6);
    gl_FragColor = vec4(mix(col, uPaper, vFog * 0.8), a * (1.0 - vFog * 0.9));
  }
`;

const HUB_VS = /* glsl */ `
  ${COMMON}
  uniform float uSize; uniform float uActive;
  attribute vec3 aCore; attribute float aSeed; attribute float aIndex;
  varying float vSeed; varying float vActive;
  void main() {
    vec3 p = nodePos(position, aCore, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vActive = 1.0 - step(0.5, abs(aIndex - uActive));
    gl_PointSize = uSize * mix(0.3, 1.0, uExpand) * (1.0 + vActive * 0.5) * uScale / -mv.z * burst();
    vFog = smoothstep(uFogNear, uFogFar * 1.4, -mv.z);
    vSeed = aSeed;
  }
`;
const HUB_FS = /* glsl */ `
  uniform vec3 uRed; uniform vec3 uInk; uniform vec3 uPaper; uniform float uTime; uniform float uStorm;
  varying float vFog; varying float vSeed; varying float vActive;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float solid = smoothstep(0.13, 0.11, d);
    float dotc = smoothstep(0.045, 0.03, d);
    float ph = fract(uTime * 0.55 + vSeed);
    float rr = 0.14 + ph * 0.34;
    float pulse = smoothstep(0.018, 0.0, abs(d - rr)) * (1.0 - ph);
    float ring = smoothstep(0.012, 0.0, abs(d - 0.2)) * 0.6;
    float glow = smoothstep(0.5, 0.1, d) * (0.1 + vActive * 0.22 + uStorm * 0.4);
    float a = max(max(solid, pulse), max(ring, glow));
    if (a < 0.01) discard;
    vec3 col = uRed;
    col = mix(col, uInk, ring * (1.0 - solid) * 0.6);
    col = mix(col, vec3(1.0), dotc);
    gl_FragColor = vec4(mix(col, uPaper, vFog * 0.7), a * (1.0 - vFog * 0.8));
  }
`;

const DUST_VS = /* glsl */ `
  uniform float uTime; uniform float uScale; uniform float uFogNear; uniform float uFogFar; uniform vec2 uMouse;
  attribute float aSeed;
  varying float vFog;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.12 + aSeed * 30.0) * 0.6 + uMouse.x * (0.4 + aSeed);
    p.y += cos(uTime * 0.10 + aSeed * 20.0) * 0.5 + uMouse.y * (0.3 + aSeed * 0.6);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, (0.025 + aSeed * 0.03) * uScale / -mv.z);
    vFog = smoothstep(uFogNear, uFogFar * 1.2, -mv.z);
  }
`;
const DUST_FS = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uPaper;
  varying float vFog;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.2, d) * 0.7;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uColor, uPaper, vFog), a * (1.0 - vFog));
  }
`;

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

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------- Camera path through the network ---------- */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(0.8, -0.5, 2),
    new THREE.Vector3(-1.9, 0.7, -7),
    new THREE.Vector3(1.7, -0.9, -16),
    new THREE.Vector3(-1.5, 0.9, -25),
    new THREE.Vector3(1.3, -0.5, -34),
    new THREE.Vector3(0, 0.2, -43),
  ], false, 'catmullrom', 0.5);

  /* ---------- Shared uniforms ---------- */
  const U = {
    uTime: { value: 0 },
    uExpand: { value: 0 },
    uHub: { value: new THREE.Vector3() },
    uCoreRot: { value: new THREE.Matrix3() },
    uScale: { value: 1 },
    uFogNear: { value: 7 },
    uFogFar: { value: 30 },
    uInk: { value: INK },
    uRed: { value: RED },
    uPaper: { value: PAPER },
    uStorm: { value: 0 },
  };

  /* ---------- Network nodes ---------- */
  // a few more nodes than before, because the network now also runs past the end of the camera path
  const N = mobile ? 172 : 320;
  const net: THREE.Vector3[] = [];
  const core: THREE.Vector3[] = [];
  const seeds: number[] = [];
  const reds: number[] = [];
  for (let i = 0; i < N; i++) {
    // t > 1 continues the network beyond the path's end, so there's still a web in front of the camera
    // when you reach the last sections (Contact) at the bottom of the page
    const t = rand() * 1.2;
    const c = path.getPoint(Math.min(t, 1));
    if (t > 1) c.z -= (t - 1) * 60;
    const th = rand() * Math.PI * 2;
    const rr = 2.3 + Math.pow(rand(), 0.75) * 7.5;
    const p = new THREE.Vector3(c.x + Math.cos(th) * rr, c.y + Math.sin(th) * rr * 0.72, c.z + (rand() - 0.5) * 4);
    net.push(p);
    // Start collapsed in a small ball: (angle, distance along path) mapped onto a sphere,
    // so neighbours in the network start near each other and the burst looks coherent.
    const lat = (Math.min(t, 1) * 2 - 1) * 1.35;
    const rad = 0.72 + 0.28 * ((rr - 2.3) / 7.5);
    core.push(new THREE.Vector3(Math.cos(lat) * Math.cos(th), Math.sin(lat), Math.cos(lat) * Math.sin(th)).multiplyScalar(rad));
    seeds.push(rand());
    reds.push(rand() < 0.08 ? 1 : 0);
  }

  // k-nearest edges
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < N; i++) {
    const d: [number, number][] = [];
    for (let j = 0; j < N; j++) if (j !== i) d.push([net[i].distanceToSquared(net[j]), j]);
    d.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 3; k++) {
      const [dist, j] = d[k];
      if (dist > 26) break;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
    }
  }

  const coreAttr = (v: THREE.Vector3[]) => {
    const a = new Float32Array(v.length * 3);
    v.forEach((p, i) => p.toArray(a, i * 3));
    return a;
  };

  // Nodes
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(coreAttr(net), 3));
  const nodeCoreBuf = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
  nodeGeo.setAttribute('aCore', nodeCoreBuf);
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seeds), 1));
  nodeGeo.setAttribute('aRed', new THREE.BufferAttribute(new Float32Array(reds), 1));
  const nodeMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uSize: { value: 0.075 } },
    vertexShader: NODE_VS, fragmentShader: NODE_FS, transparent: true, depthWrite: false,
  });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  nodes.frustumCulled = false;
  nodes.renderOrder = 2;
  scene.add(nodes);

  // Lines
  const lineGeo = new THREE.BufferGeometry();
  const lp = new Float32Array(edges.length * 6);
  const lcBuf = new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3);
  const ls = new Float32Array(edges.length * 2);
  edges.forEach(([a, b], i) => {
    net[a].toArray(lp, i * 6); net[b].toArray(lp, i * 6 + 3);
    ls[i * 2] = seeds[a]; ls[i * 2 + 1] = seeds[b];
  });
  lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lineGeo.setAttribute('aCore', lcBuf);
  lineGeo.setAttribute('aSeed', new THREE.BufferAttribute(ls, 1));
  const lineMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: INK }, uAlpha: { value: 0.13 } },
    vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  lines.renderOrder = 1;
  scene.add(lines);

  // Packets
  const P = Math.min(edges.length, mobile ? 160 : 340);
  const pkGeo = new THREE.BufferGeometry();
  const pA = new Float32Array(P * 3), pB = new Float32Array(P * 3);
  const pCA = new THREE.BufferAttribute(new Float32Array(P * 3), 3);
  const pCB = new THREE.BufferAttribute(new Float32Array(P * 3), 3);
  const pSA = new Float32Array(P), pSB = new Float32Array(P), pOff = new Float32Array(P), pSp = new Float32Array(P), pRank = new Float32Array(P);
  const pkEdges: [number, number][] = [];
  for (let i = 0; i < P; i++) {
    let [a, b] = edges[Math.floor(rand() * edges.length)];
    if (rand() > 0.5) [a, b] = [b, a];
    pkEdges.push([a, b]);
    net[a].toArray(pA, i * 3); net[b].toArray(pB, i * 3);
    pSA[i] = seeds[a]; pSB[i] = seeds[b];
    pOff[i] = rand(); pSp[i] = 0.12 + rand() * 0.25; pRank[i] = rand();
  }
  pkGeo.setAttribute('position', new THREE.BufferAttribute(pA, 3));
  pkGeo.setAttribute('aNetB', new THREE.BufferAttribute(pB, 3));
  pkGeo.setAttribute('aCoreA', pCA);
  pkGeo.setAttribute('aCoreB', pCB);
  pkGeo.setAttribute('aSeedA', new THREE.BufferAttribute(pSA, 1));
  pkGeo.setAttribute('aSeedB', new THREE.BufferAttribute(pSB, 1));
  pkGeo.setAttribute('aOff', new THREE.BufferAttribute(pOff, 1));
  pkGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSp, 1));
  pkGeo.setAttribute('aRank', new THREE.BufferAttribute(pRank, 1));
  const pkMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uSize: { value: 0.16 }, uDensity: { value: 0.55 } },
    vertexShader: PACKET_VS, fragmentShader: PACKET_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const packets = new THREE.Points(pkGeo, pkMat);
  packets.frustumCulled = false;
  packets.renderOrder = 3;
  scene.add(packets);

  // Section hubs (positions depend on the page layout → relayout())
  const sectionEls = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const H = sectionEls.length;
  const hubGeo = new THREE.BufferGeometry();
  const hubPos = new THREE.BufferAttribute(new Float32Array(H * 3), 3);
  const hubCore = new THREE.BufferAttribute(new Float32Array(H * 3), 3);
  const hubCoreBase: THREE.Vector3[] = [];
  const hubSeeds = new Float32Array(H);
  const hubIdx = new Float32Array(H);
  for (let i = 0; i < H; i++) {
    const a = (i / H) * Math.PI * 2;
    hubCoreBase.push(new THREE.Vector3(Math.cos(a) * 0.5, (rand() - 0.5) * 0.6, Math.sin(a) * 0.5));
    hubSeeds[i] = rand(); hubIdx[i] = i;
  }
  hubGeo.setAttribute('position', hubPos);
  hubGeo.setAttribute('aCore', hubCore);
  hubGeo.setAttribute('aSeed', new THREE.BufferAttribute(hubSeeds, 1));
  hubGeo.setAttribute('aIndex', new THREE.BufferAttribute(hubIdx, 1));
  const hubMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uSize: { value: 0.7 }, uActive: { value: -1 } },
    vertexShader: HUB_VS, fragmentShader: HUB_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const hubs = new THREE.Points(hubGeo, hubMat);
  hubs.frustumCulled = false;
  hubs.renderOrder = 4;
  scene.add(hubs);

  // Hub → network spokes (rebuilt on relayout)
  const spokeMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: RED }, uAlpha: { value: 0.35 } },
    vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false,
  });
  let spokes: THREE.LineSegments | null = null;

  // Dust
  const D = mobile ? 260 : 700;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(D * 3), dsd = new Float32Array(D);
  for (let i = 0; i < D; i++) {
    dp[i * 3] = (rand() - 0.5) * 30;
    dp[i * 3 + 1] = (rand() - 0.5) * 20;
    dp[i * 3 + 2] = 12 - rand() * 66;
    dsd[i] = rand();
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dsd, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uScale: U.uScale, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uMouse: { value: new THREE.Vector2() }, uColor: { value: new THREE.Color(THEMES.light.dust) }, uPaper: U.uPaper },
    vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---------- Hero: stack cards gliding right → left on a gentle curve ---------- */
  // `hero` sits at the top of the curve, in the band under the name.
  const hero = new THREE.Group();
  scene.add(hero);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 6);
  scene.add(key);

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
    heroH: 1, hubDocX: 0, hubDocY: 0, stripDocX: 0, stripDocY: 0, sag: 60, card: 1, rc: 0.8,
    stepPx: 200, spanPx: 2400, speed: 50,
    begin: 1, end: 2,
    sections: [] as { id: string; top: number }[],
  };
  const hubNet: THREE.Vector3[] = [];

  function relayout() {
    L.W = canvas.clientWidth || window.innerWidth;
    L.Hh = canvas.clientHeight || window.innerHeight;
    renderer.setSize(L.W, L.Hh, false);
    camera.aspect = L.W / L.Hh;
    camera.fov = L.W / L.Hh < 0.8 ? 46 : 35;
    camera.updateProjectionMatrix();
    U.uScale.value = (L.Hh * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));

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
    // The scroll burst erupts from the top of the curve.
    L.hubDocX = L.stripDocX;
    L.hubDocY = apex;
    // Spacing: a small gap between cards, and the loop is always longer than the
    // screen so the wrap-around point stays off-screen.
    L.stepPx = Math.max(cw * 1.1, (L.W + cw * 2.6) / cards.length);
    L.spanPx = L.stepPx * cards.length;
    L.speed = narrow ? 38 : 52; // px per second
    L.card = cw * L.wpp;
    L.rc = (narrow ? 40 : 60) * L.wpp;

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    L.begin = L.heroH * 0.45;
    L.end = Math.max(L.begin + 1, maxScroll);

    // core attribute = unit core * radius
    for (let i = 0; i < N; i++) core[i].clone().multiplyScalar(L.rc).toArray(nodeCoreBuf.array as Float32Array, i * 3);
    nodeCoreBuf.needsUpdate = true;
    edges.forEach(([a, b], i) => {
      core[a].clone().multiplyScalar(L.rc).toArray(lcBuf.array as Float32Array, i * 6);
      core[b].clone().multiplyScalar(L.rc).toArray(lcBuf.array as Float32Array, i * 6 + 3);
    });
    lcBuf.needsUpdate = true;
    pkEdges.forEach(([a, b], i) => {
      core[a].clone().multiplyScalar(L.rc).toArray(pCA.array as Float32Array, i * 3);
      core[b].clone().multiplyScalar(L.rc).toArray(pCB.array as Float32Array, i * 3);
    });
    pCA.needsUpdate = true; pCB.needsUpdate = true;

    // Section hubs: placed just ahead of where the camera is when each section is on screen.
    L.sections = sectionEls.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top + sy }));
    hubNet.length = 0;
    L.sections.forEach((s, i) => {
      const p = clamp01((s.top + L.Hh * 0.2 - L.begin) / (L.end - L.begin));
      const t = clamp01(p + 0.1);
      const pt = path.getPoint(t);
      const side = i % 2 === 0 ? 1 : -1;
      const v = new THREE.Vector3(pt.x + side * (narrow ? 1.2 : 2.6), pt.y + 1.1, pt.z);
      hubNet.push(v);
      v.toArray(hubPos.array as Float32Array, i * 3);
      hubCoreBase[i].clone().multiplyScalar(L.rc).toArray(hubCore.array as Float32Array, i * 3);
    });
    hubPos.needsUpdate = true; hubCore.needsUpdate = true;

    // spokes: each hub to its 5 nearest network nodes
    if (spokes) { scene.remove(spokes); spokes.geometry.dispose(); }
    const sp: number[] = [], sc: number[] = [], ss: number[] = [];
    hubNet.forEach((h, hi) => {
      const near = net.map((p, j) => [p.distanceToSquared(h), j] as [number, number]).sort((a, b) => a[0] - b[0]).slice(0, 5);
      for (const [, j] of near) {
        sp.push(h.x, h.y, h.z, net[j].x, net[j].y, net[j].z);
        const hc = hubCoreBase[hi].clone().multiplyScalar(L.rc), nc = core[j].clone().multiplyScalar(L.rc);
        sc.push(hc.x, hc.y, hc.z, nc.x, nc.y, nc.z);
        ss.push(hubSeeds[hi], seeds[j]);
      }
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3));
    sg.setAttribute('aCore', new THREE.BufferAttribute(new Float32Array(sc), 3));
    sg.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(ss), 1));
    spokes = new THREE.LineSegments(sg, spokeMat);
    spokes.frustumCulled = false;
    spokes.renderOrder = 1;
    scene.add(spokes);

    // Hero object sizes
    cards.forEach((c) => c.holder.scale.setScalar(L.card));
    needsRender = true;
  }

  /* ---------- Interaction state ---------- */
  let paused = false;
  let needsRender = true;
  let storm = 0;
  let activeHub = -1;
  let camP = 0;
  let expand = 0;
  let slide = 0; // how far the strip has moved left (px)
  let wheelVel = 0;
  let pace = 1; // slows down while a card is hovered
  const mouse = new THREE.Vector2();
  const camOffset = new THREE.Vector2();
  const look = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const euler = new THREE.Euler();
  const m4 = new THREE.Matrix4();
  let hoveredCard: Card | null = null;
  let pinnedId: string | null = null; // touch: a tapped card stays flipped
  const raycaster = new THREE.Raycaster();

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

  /* ---------- Frame ---------- */
  function tick(dt: number, time: number) {
    if (paused && !needsRender) return;
    const t = reduced ? 0 : time;
    U.uTime.value = t;

    const s = input.scrollY;
    // Hero → network explosion
    const targetExpand = reduced ? 0 : smooth(L.heroH * 0.04, L.heroH * 0.85, s);
    expand = reduced ? 0 : damp(expand, targetExpand, 6, dt);
    U.uExpand.value = expand;

    // Mouse smoothing
    mouse.x = damp(mouse.x, input.mouseX, 3, dt);
    mouse.y = damp(mouse.y, input.mouseY, 3, dt);
    dustMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Camera along the path
    const pTarget = reduced ? 0 : clamp01((s - L.begin) / (L.end - L.begin));
    camP = reduced ? 0 : damp(camP, pTarget, 2.6, dt);
    const ease = camP * camP * (3 - 2 * camP) * 0.35 + camP * 0.65;
    path.getPoint(ease, camera.position);
    path.getPoint(Math.min(1, ease + 0.05), look);
    look.z -= 6;
    camOffset.x = damp(camOffset.x, mouse.x * 0.35, 2.5, dt);
    camOffset.y = damp(camOffset.y, mouse.y * 0.22, 2.5, dt);
    camera.position.x += camOffset.x;
    camera.position.y += camOffset.y;
    if (camP < 0.001) look.set(camera.position.x * 0.5, camera.position.y * 0.5, 0);
    else look.lerp(tmpV.set(camera.position.x * 0.5, camera.position.y * 0.5, 0), 1 - smooth(0, 0.08, camP));
    camera.lookAt(look);
    const roll = reduced ? 0 : Math.sin(ease * Math.PI * 2) * 0.05 + THREE.MathUtils.clamp(input.velocity * 0.0015, -0.04, 0.04);
    camera.rotateZ(roll);

    // Burst origin and the top of the curve, both attached to the page
    docToWorld(L.hubDocX, L.hubDocY, s, U.uHub.value);
    docToWorld(L.stripDocX, L.stripDocY, s, hero.position);
    hero.visible = expand < 0.995;

    // The collapsed network follows the cursor a little, then spins out as it bursts
    const shatter = smooth(0, 0.6, expand);
    euler.set(mouse.y * 0.35, mouse.x * 0.55 + shatter * 1.4, 0);
    m4.makeRotationFromEuler(euler);
    U.uCoreRot.value.setFromMatrix4(m4);

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

    // Storm (easter egg) decays
    storm = Math.max(0, storm - dt * 0.3);
    U.uStorm.value = storm * storm * (3 - 2 * storm);
    hubMat.uniforms.uActive.value = activeHub;

    renderer.render(scene, camera);
    needsRender = false;
  }

  /** Light theme: dark nodes on white with normal blending (additive glow vanishes on white).
   *  Dark theme: light nodes on near-black with additive glow. */
  let shadowK = THEMES.light.shadow;
  function applyTheme() {
    const th = document.documentElement.dataset.theme === 'dark' ? THEMES.dark : THEMES.light;
    const dark = th === THEMES.dark;
    PAPER.set(th.paper);
    INK.set(th.ink);
    RED.set(th.accent);
    renderer.setClearColor(PAPER, 1);
    dustMat.uniforms.uColor.value.set(th.dust);
    lineMat.uniforms.uAlpha.value = th.line;
    for (const m of [pkMat, hubMat]) {
      m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
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
    storm() { storm = 1; },
    focus(id) {
      activeHub = id ? L.sections.findIndex((s) => s.id === id) : -1;
    },
    setPaused(p) { paused = p; if (!p) needsRender = true; },
  };
}
