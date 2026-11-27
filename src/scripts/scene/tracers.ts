/* ==========================================================================
   Tracers: the page background, kept quiet on purpose.
   Small agents walk an invisible grid across the whole screen. Each leaves a
   1px line that fades after a few seconds; now and then one stops to mark a
   small square (a task done) and moves on.

   - They start spread over the screen, one after another, and keep away from
     each other, so they cover the whole screen; near the cursor they tend to
     turn toward it.
   - Spread: the whole background can be gathered into one point (at the top
     of the page, the point under the hero cards). As `spread` goes 0 → 1 the
     lines flow out of that point to their places, each line a little after
     the last; going back 1 → 0 they all flow back into it.
   - The grid scrolls with the page (with parallax); agents that leave the
     screen come back in from an edge.
   ========================================================================== */
import * as THREE from 'three';

export type TracerLook = { paper: string; ink: string; accent: string; inkA: number; tealA: number; headA: number };

export type Tracers = {
  /** Add to the main scene; it draws first, in screen space. */
  mesh: THREE.Mesh;
  resize(cssW: number, cssH: number): void;
  /** The agents appear, spread over the screen. */
  start(): void;
  /** spread: 0 = every line gathered at (cx, cy), css px → 1 = every line in its place. */
  update(dt: number, i: { scrollY: number; cursorX: number; cursorY: number; cursor: boolean; spread: number; cx: number; cy: number }): void;
  /** Run `seconds` of motion at once and keep that frame (reduced motion). */
  settle(seconds: number): void;
  setLook(l: TracerLook): void;
};

// Alpha = (1 − age / life)² × how far the line has come out of the gathering point; colour and strength by kind.
const VS = /* glsl */ `
  attribute float aT;
  attribute float aLife;
  attribute float aKind;
  attribute float aShow;
  uniform vec2 uView;
  uniform float uTime;
  varying float vA;
  varying float vKind;
  void main() {
    gl_Position = vec4(position.x / uView.x * 2.0 - 1.0, 1.0 - position.y / uView.y * 2.0, 0.0, 1.0);
    float k = clamp(1.0 - (uTime - aT) / aLife, 0.0, 1.0);
    vA = k * k * aShow;
    vKind = aKind;
  }
`;
const FS = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uInkA;
  uniform float uTealA;
  uniform float uHeadA;
  varying float vA;
  varying float vKind;
  void main() {
    vec3 col = vKind < 0.5 ? uInk : uAccent;
    float a = vKind < 0.5 ? uInkA : (vKind < 1.5 ? uTealA : uHeadA);
    gl_FragColor = vec4(col, a * vA);
  }
`;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// right, down, left, up (screen y points down)
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
const INK = 0, TEAL = 1, HEAD = 2;

type Pt = { x: number; y: number; t: number }; // grid units, time it was laid down
type Mark = Pt & { life: number; seed: number };
/** seed: when this line comes out of the gathering point (0 first → 1 last). */
type Line = { pts: Pt[]; teal: boolean; life: number; seed: number };
type Agent = { gx: number; gy: number; d: number; p: number; speed: number; line: Line; wait: number; cool: number };
/** An extra trail that only shows while the lines flow out of (or back into) the gathering point. d = cells along it. */
type Ghost = { pts: { x: number; y: number; d: number }[]; teal: boolean; seed: number; len: number; mark: boolean };

export function createTracers(o: { mobile: boolean; seed: () => number }): Tracers {
  const rand = o.seed;
  const CELL = o.mobile ? 36 : 44; // css px
  const LIFE = 6.5; // seconds a line stays visible
  const PARALLAX = 0.35;
  const SPEED = o.mobile ? 1.6 : 1.9; // walking speed, cells per second

  /* ---------- Geometry: every line segment, mark and head is a quad ---------- */
  const MAX_Q = 6000;
  const pos = new Float32Array(MAX_Q * 6 * 2);
  const born = new Float32Array(MAX_Q * 6);
  const life = new Float32Array(MAX_Q * 6);
  const kind = new Float32Array(MAX_Q * 6);
  const show = new Float32Array(MAX_Q * 6);
  const geo = new THREE.BufferGeometry();
  const attrs = [
    ['position', new THREE.BufferAttribute(pos, 2)],
    ['aT', new THREE.BufferAttribute(born, 1)],
    ['aLife', new THREE.BufferAttribute(life, 1)],
    ['aKind', new THREE.BufferAttribute(kind, 1)],
    ['aShow', new THREE.BufferAttribute(show, 1)],
  ] as const;
  for (const [name, a] of attrs) geo.setAttribute(name, a.setUsage(THREE.DynamicDrawUsage));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); // drawn in screen space
  geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uView: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
      uInk: { value: rgb('#2a2a2a') }, uAccent: { value: rgb('#12a08c') },
      uInkA: { value: 0.2 }, uTealA: { value: 0.5 }, uHeadA: { value: 0.9 },
    },
    vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;

  /* ---------- State ---------- */
  const lines: Line[] = [];
  const marks: Mark[] = [];
  const agents: Agent[] = [];
  let W = 1, H = 1, ox = 0, oy = 0, scroll = 0, now = 0;
  let spread = 1, px0 = 0, py0 = 0; // how far out of the gathering point, and the point (css px)
  let ghosts: Ghost[] = [];
  let ghostsSeen = false; // shown since they were laid out (they are laid out afresh each time all is gathered)
  const sx = (gx: number) => gx * CELL + ox;
  const sy = (gy: number) => gy * CELL + oy;
  const offScreen = (gx: number, gy: number, m: number) => sx(gx) < -m || sx(gx) > W + m || sy(gy) < -m || sy(gy) > H + m;
  function place() {
    ox = Math.round((W % CELL) / 2);
    oy = Math.round((H % CELL) / 2 - scroll * PARALLAX);
  }
  function line(gx: number, gy: number, teal: boolean, lf: number): Line {
    const l: Line = { pts: [{ x: gx, y: gy, t: now }], teal, life: lf, seed: rand() };
    lines.push(l);
    return l;
  }

  /* ---------- Walking agents ---------- */
  function spawn(gx: number, gy: number, d: number, teal: boolean) {
    agents.push({ gx, gy, d, p: 0, speed: SPEED * (0.85 + rand() * 0.3), line: line(gx, gy, teal, LIFE), wait: 0, cool: 2 + rand() * 5 });
  }
  /** Back in from a random screen edge, one cell outside so it slides in. */
  function reenter(a: Agent) {
    const gx0 = Math.ceil(-ox / CELL), gx1 = Math.floor((W - ox) / CELL);
    const gy0 = Math.ceil(-oy / CELL), gy1 = Math.floor((H - oy) / CELL);
    const rx = () => gx0 + 1 + Math.floor(rand() * Math.max(1, gx1 - gx0 - 1));
    const ry = () => gy0 + 1 + Math.floor(rand() * Math.max(1, gy1 - gy0 - 1));
    const side = Math.floor(rand() * 4);
    if (side === 0) { a.gx = gx0 - 1; a.gy = ry(); a.d = 0; }
    else if (side === 1) { a.gx = rx(); a.gy = gy0 - 1; a.d = 1; }
    else if (side === 2) { a.gx = gx1 + 1; a.gy = ry(); a.d = 2; }
    else { a.gx = rx(); a.gy = gy1 + 1; a.d = 3; }
    a.p = 0;
    a.line = line(a.gx, a.gy, a.line.teal, LIFE);
  }

  const cur = { x: 0, y: 0, on: false };
  function pickDir(a: Agent) {
    const cand = [a.d, (a.d + 1) % 4, (a.d + 3) % 4];
    const x = sx(a.gx), y = sy(a.gy);
    const inset = CELL * 1.5;
    const reach = CELL * 7;
    const w = [0.72, 0.14, 0.14];
    for (let i = 0; i < 3; i++) {
      const [dx, dy] = DIRS[cand[i]];
      const nx = x + dx * CELL, ny = y + dy * CELL;
      if (nx < inset || nx > W - inset || ny < inset || ny > H - inset) w[i] *= 0.15; // stay on screen
      // keep away from the other agents, so they spread over the whole screen
      let crowd = 0;
      for (const b of agents) {
        if (b === a) continue;
        const dist = Math.hypot(sx(b.gx) - nx, sy(b.gy) - ny);
        if (dist < reach) crowd += 1 - dist / reach;
      }
      w[i] /= 1 + crowd * 4;
      if (cur.on) {
        const cx = cur.x - x, cy = cur.y - y, dist = Math.hypot(cx, cy);
        if (dist > CELL && dist < 420) w[i] *= 1 + 3 * Math.max(0, (dx * cx + dy * cy) / dist) * (1 - dist / 420);
      }
    }
    let r = rand() * (w[0] + w[1] + w[2]);
    for (let i = 0; i < 3; i++) { r -= w[i]; if (r <= 0) return cand[i]; }
    return cand[0];
  }

  /** Reached a grid point (at time t): maybe stop for a task, maybe turn. */
  function arrive(a: Agent, t: number) {
    if (offScreen(a.gx, a.gy, CELL * 2)) { a.line.pts.push({ x: a.gx, y: a.gy, t }); reenter(a); return; }
    if (a.cool <= 0 && !offScreen(a.gx, a.gy, -CELL) && rand() < 0.14) {
      marks.push({ x: a.gx, y: a.gy, t, life: LIFE, seed: a.line.seed });
      a.line.pts.push({ x: a.gx, y: a.gy, t });
      a.wait = 0.9;
      a.cool = 5 + rand() * 7;
      a.d = pickDir(a);
      return;
    }
    const d = pickDir(a);
    if (d !== a.d) { a.line.pts.push({ x: a.gx, y: a.gy, t }); a.d = d; }
  }

  function walk(a: Agent, dt: number) {
    a.cool -= dt;
    if (a.wait > 0) {
      a.wait -= dt;
      if (a.wait <= 0) a.line.pts.push({ x: a.gx, y: a.gy, t: now }); // the next run starts timing from here
      return;
    }
    a.p += a.speed * dt;
    while (a.p >= 1) {
      a.p -= 1;
      a.gx += DIRS[a.d][0];
      a.gy += DIRS[a.d][1];
      arrive(a, now - a.p / a.speed);
      if (a.wait > 0) { a.p = 0; break; }
    }
  }

  /* ---------- Build the quads ---------- */
  let q = 0;
  function quad(ax: number, ay: number, at: number, bx: number, by: number, bt: number, k: number, hw: number, lf: number, sh: number) {
    if (q >= MAX_Q) return;
    let dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) { dx = 1; dy = 0; } else { dx /= len; dy /= len; }
    // extend by hw at both ends so corners close
    const x0 = ax - dx * hw, y0 = ay - dy * hw, x1 = bx + dx * hw, y1 = by + dy * hw;
    const nx = -dy * hw, ny = dx * hw;
    const v = [x0 + nx, y0 + ny, at, x1 + nx, y1 + ny, bt, x1 - nx, y1 - ny, bt, x0 + nx, y0 + ny, at, x1 - nx, y1 - ny, bt, x0 - nx, y0 - ny, at];
    for (let i = 0; i < 6; i++) {
      const j = q * 6 + i;
      pos[j * 2] = v[i * 3];
      pos[j * 2 + 1] = v[i * 3 + 1];
      born[j] = v[i * 3 + 2];
      life[j] = lf;
      kind[j] = k;
      show[j] = sh;
    }
    q++;
  }

  /**
   * The extra trails, so plenty pours out of the gathering point: short grid walks laid over the
   * screen (and a little below it, as the grid drifts up when you scroll), drawn like the walkers' trails.
   */
  function makeGhosts() {
    ghosts = [];
    const n = o.mobile ? 34 : 72;
    const top = -H * 0.05, span = H * 1.3;
    const cols = Math.max(1, Math.round(Math.sqrt((n * W) / span)));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = ((c + 0.1 + rand() * 0.8) / cols) * W;
      const y = top + ((r + 0.1 + rand() * 0.8) / rows) * span;
      let gx = Math.round((x - ox) / CELL), gy = Math.round((y - oy) / CELL);
      let d = Math.floor(rand() * 4);
      const steps = 4 + Math.floor(rand() * 9);
      const pts = [{ x: gx, y: gy, d: 0 }];
      for (let s = 1; s <= steps; s++) {
        if (s > 1 && rand() < 0.22) { // turn here
          pts.push({ x: gx, y: gy, d: s - 1 });
          d = (d + (rand() < 0.5 ? 1 : 3)) % 4;
        }
        gx += DIRS[d][0]; gy += DIRS[d][1];
      }
      pts.push({ x: gx, y: gy, d: steps });
      ghosts.push({ pts, teal: rand() < 0.33, seed: rand(), len: steps, mark: rand() < 0.25 });
    }
  }

  /** How far out of the gathering point a line with this seed is: 0 gathered → 1 in its place. */
  function out(seed: number) {
    if (spread >= 1) return 1;
    const t = Math.min(1, Math.max(0, spread * 1.4 - seed * 0.4));
    return t * t * (3 - 2 * t);
  }

  function build() {
    q = 0;
    const heads = new Map<Line, Pt>();
    for (const a of agents) heads.set(a.line, { x: a.gx + DIRS[a.d][0] * a.p, y: a.gy + DIRS[a.d][1] * a.p, t: now });
    for (let li = lines.length - 1; li >= 0; li--) {
      const l = lines[li];
      const cutoff = now - l.life;
      const head = heads.get(l);
      // forget points whose following point has faded too
      let drop = 0;
      while (drop < l.pts.length - 1 && l.pts[drop + 1].t <= cutoff) drop++;
      if (drop) l.pts.splice(0, drop);
      const pts = head ? [...l.pts, head] : l.pts;
      if (!head && (pts.length < 2 || pts[pts.length - 1].t <= cutoff)) { lines.splice(li, 1); continue; }
      // a gathered line is pulled in toward the point, and fades as it gets there
      const f = out(l.seed), sh = smooth(0, 0.15, f);
      if (sh <= 0.002) continue;
      const X = (gx: number) => px0 + (sx(gx) - px0) * f;
      const Y = (gy: number) => py0 + (sy(gy) - py0) * f;
      const k = l.teal ? TEAL : INK;
      for (let i = 0; i < pts.length - 1; i++) {
        let a = pts[i];
        const b = pts[i + 1];
        if (a.t < cutoff && b.t > a.t) { // trim the faded part, so the tail fades smoothly
          const fr = (cutoff - a.t) / (b.t - a.t);
          a = { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr, t: cutoff };
        }
        quad(X(a.x), Y(a.y), a.t, X(b.x), Y(b.y), b.t, k, 0.5, l.life, sh);
      }
    }
    // the extra trails come out of the point with the rest, and melt away as they reach their places
    for (const g of ghosts) {
      const f = out(g.seed), sh = smooth(0, 0.15, f) * (1 - smooth(0.55, 1, f));
      if (sh <= 0.002) continue;
      ghostsSeen = true;
      const X = (gx: number) => px0 + (sx(gx) - px0) * f;
      const Y = (gy: number) => py0 + (sy(gy) - py0) * f;
      const tAt = (d: number) => now - (g.len - d) * 0.35; // the end is fresh, the start older, like a walker's trail
      const k = g.teal ? TEAL : INK;
      for (let i = 0; i < g.pts.length - 1; i++) {
        const a = g.pts[i], b = g.pts[i + 1];
        quad(X(a.x), Y(a.y), tAt(a.d), X(b.x), Y(b.y), tAt(b.d), k, 0.5, LIFE, sh);
      }
      const e = g.pts[g.pts.length - 1], x = X(e.x), y = Y(e.y);
      if (g.mark) {
        const s = 5 * Math.max(0.3, f);
        quad(x - s, y - s, now, x + s, y - s, now, TEAL, 0.5, LIFE, sh);
        quad(x + s, y - s, now, x + s, y + s, now, TEAL, 0.5, LIFE, sh);
        quad(x + s, y + s, now, x - s, y + s, now, TEAL, 0.5, LIFE, sh);
        quad(x - s, y + s, now, x - s, y - s, now, TEAL, 0.5, LIFE, sh);
      } else {
        quad(x - 0.01, y, now, x + 0.01, y, now, HEAD, 2, LIFE, sh);
      }
    }
    // marks: a small open square (a task done), moving with its line
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i];
      if (m.t <= now - m.life) { marks.splice(i, 1); continue; }
      const f = out(m.seed), sh = smooth(0, 0.15, f);
      if (sh <= 0.002) continue;
      const x = px0 + (sx(m.x) - px0) * f, y = py0 + (sy(m.y) - py0) * f, s = 5 * Math.max(0.3, f);
      quad(x - s, y - s, m.t, x + s, y - s, m.t, TEAL, 0.5, m.life, sh);
      quad(x + s, y - s, m.t, x + s, y + s, m.t, TEAL, 0.5, m.life, sh);
      quad(x + s, y + s, m.t, x - s, y + s, m.t, TEAL, 0.5, m.life, sh);
      quad(x - s, y + s, m.t, x - s, y - s, m.t, TEAL, 0.5, m.life, sh);
    }
    // heads: tiny teal squares, on their lines
    for (const [l, h] of heads) {
      const f = out(l.seed), sh = smooth(0, 0.15, f);
      if (sh <= 0.002) continue;
      const x = px0 + (sx(h.x) - px0) * f, y = py0 + (sy(h.y) - py0) * f;
      quad(x - 0.01, y, now, x + 0.01, y, now, HEAD, 2, LIFE, sh);
    }
    for (const [, a] of attrs) {
      a.needsUpdate = true;
      a.clearUpdateRanges();
      a.addUpdateRange(0, q * 6 * a.itemSize);
    }
    geo.setDrawRange(0, q * 6);
    mat.uniforms.uTime.value = now;
  }

  function step(dt: number) {
    now += dt;
    for (const a of agents) walk(a, dt);
  }

  return {
    mesh,
    resize(w, h) {
      W = w; H = h;
      place();
      mat.uniforms.uView.value.set(W, H);
      makeGhosts();
      build();
    },
    start() {
      // about one agent per 275 × 275 px, one per cell of a coarse grid so they start spread out;
      // each waits a moment before setting off, so they don't all move in step
      const count = THREE.MathUtils.clamp(Math.round((W * H) / 75000), 5, 20);
      const cols = Math.max(1, Math.round(Math.sqrt((count * W) / H)));
      const rows = Math.ceil(count / cols);
      const m = CELL * 1.5;
      for (let i = 0; i < count; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = m + ((c + 0.2 + rand() * 0.6) / cols) * (W - 2 * m);
        const y = m + ((r + 0.2 + rand() * 0.6) / rows) * (H - 2 * m);
        spawn(Math.round((x - ox) / CELL), Math.round((y - oy) / CELL), Math.floor(rand() * 4), i % 3 === 1);
        agents[agents.length - 1].wait = rand() * 1.4;
      }
      build();
    },
    update(dt, i) {
      scroll = i.scrollY;
      place();
      spread = Math.min(1, Math.max(0, i.spread));
      px0 = i.cx; py0 = i.cy;
      // all gathered again: lay the extra trails out afresh for the next time it spreads
      if (spread <= 0.001 && ghostsSeen) { makeGhosts(); ghostsSeen = false; }
      // the cursor only steers them once they are all out
      cur.x = i.cursorX; cur.y = i.cursorY; cur.on = i.cursor && spread >= 0.98;
      step(dt);
      build();
    },
    settle(seconds) {
      for (let t = 0; t < seconds; t += 1 / 30) step(1 / 30);
      build();
    },
    setLook(l) {
      const u = mat.uniforms;
      u.uInk.value.copy(rgb(l.ink));
      u.uAccent.value.copy(rgb(l.accent));
      u.uInkA.value = l.inkA;
      u.uTealA.value = l.tealA;
      u.uHeadA.value = l.headA;
    },
  };
}
