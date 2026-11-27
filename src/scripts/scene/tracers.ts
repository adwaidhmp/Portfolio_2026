/* ==========================================================================
   Tracers: the page background, kept quiet on purpose.
   Small agents walk an invisible grid across the whole screen. Each leaves a
   1px line that fades after a few seconds; now and then one stops to mark a
   small square (a task done) and moves on.

   - Blast: from the grid point behind the hero card strip, lines branch out
     along the same grid, like a circuit being routed: every branch moves at
     the same pace (so the front grows as a diamond), splits off side branches
     and stops where it would cross another one, sometimes with a small pad at
     its end. Some branch ends carry on as the walking agents. It fires on
     load and again when the cards fly off on scroll.
   - Walking agents keep away from each other, so they cover the whole screen,
     and near the cursor they tend to turn toward it.
   - The grid scrolls with the page (with parallax); agents that leave the
     screen come back in from an edge.
   ========================================================================== */
import * as THREE from 'three';

export type TracerLook = { paper: string; ink: string; accent: string; inkA: number; tealA: number; headA: number };

export type Tracers = {
  /** Add to the main scene; it draws first, in screen space. */
  mesh: THREE.Mesh;
  resize(cssW: number, cssH: number): void;
  /** Blast from (x, y) css px; the walking agents come out of it. */
  start(x: number, y: number): void;
  /** Blast from (x, y) css px with up to n branches. */
  blast(x: number, y: number, n: number): void;
  update(dt: number, i: { scrollY: number; cursorX: number; cursorY: number; cursor: boolean }): void;
  /** Run `seconds` of motion at once and keep that frame (reduced motion). */
  settle(seconds: number): void;
  setLook(l: TracerLook): void;
};

// Alpha = (1 − age / life)²; colour and strength by kind.
const VS = /* glsl */ `
  attribute float aT;
  attribute float aLife;
  attribute float aKind;
  uniform vec2 uView;
  uniform float uTime;
  varying float vA;
  varying float vKind;
  void main() {
    gl_Position = vec4(position.x / uView.x * 2.0 - 1.0, 1.0 - position.y / uView.y * 2.0, 0.0, 1.0);
    float k = clamp(1.0 - (uTime - aT) / aLife, 0.0, 1.0);
    vA = k * k;
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

// right, down, left, up (screen y points down)
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
const INK = 0, TEAL = 1, HEAD = 2;

type Pt = { x: number; y: number; t: number }; // grid units, time it was laid down
type Mark = Pt & { life: number };
type Line = { pts: Pt[]; teal: boolean; life: number };
type Agent = { gx: number; gy: number; d: number; p: number; speed: number; line: Line; wait: number; cool: number };
/** One blast: its clock, the grid points its lines have taken, and how many branches it may still grow. */
type Blast = { t0: number; taken: Set<string>; left: number; seed: boolean; branches: number };
type Branch = { gx: number; gy: number; d: number; p: number; line: Line; blast: Blast; gen: number; run: number; split: number; side: number };

export function createTracers(o: { mobile: boolean; seed: () => number }): Tracers {
  const rand = o.seed;
  const CELL = o.mobile ? 36 : 44; // css px
  const LIFE = 6.5; // seconds a walker's line stays visible
  const BLAST_LIFE = 4; // blast lines clear a little sooner
  const PARALLAX = 0.35;
  const SPEED = o.mobile ? 1.6 : 1.9; // walking speed, cells per second

  /* ---------- Geometry: every line segment, mark and head is a quad ---------- */
  const MAX_Q = 6000;
  const pos = new Float32Array(MAX_Q * 6 * 2);
  const born = new Float32Array(MAX_Q * 6);
  const life = new Float32Array(MAX_Q * 6);
  const kind = new Float32Array(MAX_Q * 6);
  const geo = new THREE.BufferGeometry();
  const attrs = [
    ['position', new THREE.BufferAttribute(pos, 2)],
    ['aT', new THREE.BufferAttribute(born, 1)],
    ['aLife', new THREE.BufferAttribute(life, 1)],
    ['aKind', new THREE.BufferAttribute(kind, 1)],
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
  const branches: Branch[] = [];
  let W = 1, H = 1, ox = 0, oy = 0, scroll = 0, now = 0;
  let wanted = 0; // walking agents to keep on screen
  const sx = (gx: number) => gx * CELL + ox;
  const sy = (gy: number) => gy * CELL + oy;
  const offScreen = (gx: number, gy: number, m: number) => sx(gx) < -m || sx(gx) > W + m || sy(gy) < -m || sy(gy) > H + m;
  function place() {
    ox = Math.round((W % CELL) / 2);
    oy = Math.round((H % CELL) / 2 - scroll * PARALLAX);
  }
  function line(gx: number, gy: number, teal: boolean, lf: number): Line {
    const l: Line = { pts: [{ x: gx, y: gy, t: now }], teal, life: lf };
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
  const distToAgents = (gx: number, gy: number) => agents.reduce((m, b) => Math.min(m, Math.abs(b.gx - gx) + Math.abs(b.gy - gy)), Infinity);

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
      marks.push({ x: a.gx, y: a.gy, t, life: LIFE });
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

  /* ---------- Blast: branches routed out along the grid ---------- */
  const key = (gx: number, gy: number) => `${gx},${gy}`;
  /** Every branch of a blast shares one pace: quick at first, easing toward a walk. */
  const blastSpeed = (b: Blast) => SPEED * 1.6 + (o.mobile ? 9 : 12) * Math.exp(-(now - b.t0) * 0.9);
  function branch(b: Blast, gx: number, gy: number, d: number, gen: number) {
    if (b.left <= 0) return;
    b.left--;
    b.branches++;
    // the four main arms run to the screen edge; side branches are shorter each generation
    const run = gen === 0 ? Infinity : Math.round([0, 12, 8, 5][gen] * (0.4 + rand() * 0.6)) + 2;
    branches.push({
      gx, gy, d, p: 0, blast: b, gen, run,
      split: gen === 0 ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3),
      side: rand() < 0.5 ? 1 : 3,
      line: line(gx, gy, rand() < 0.3, BLAST_LIFE),
    });
  }
  function blast(x: number, y: number, n: number, seed = false) {
    const gx = Math.round((x - ox) / CELL), gy = Math.round((y - oy) / CELL);
    const b: Blast = { t0: now, taken: new Set([key(gx, gy)]), left: n, seed, branches: 0 };
    for (let d = 0; d < 4; d++) branch(b, gx, gy, d, 0);
  }
  /** A branch stops: sometimes a small pad, sometimes it carries on as a walking agent. */
  function end(r: Branch, t: number) {
    r.line.pts.push({ x: r.gx, y: r.gy, t });
    const onScreen = !offScreen(r.gx, r.gy, -CELL);
    if (onScreen && r.blast.seed && agents.length < wanted && distToAgents(r.gx, r.gy) > 4) {
      spawn(r.gx, r.gy, r.d, r.line.teal);
    } else if (onScreen && rand() < 0.4) {
      marks.push({ x: r.gx, y: r.gy, t, life: BLAST_LIFE });
    }
  }
  /** Moves one branch; false once it has stopped. */
  function grow(r: Branch, dt: number): boolean {
    const spd = blastSpeed(r.blast);
    r.p += spd * dt;
    while (r.p >= 1) {
      const [dx, dy] = DIRS[r.d];
      const nx = r.gx + dx, ny = r.gy + dy;
      const t = now - (r.p - 1) / spd;
      // never cross another line of this blast, and stop at the edge of the screen
      if (r.blast.taken.has(key(nx, ny)) || r.run <= 0 || offScreen(nx, ny, CELL)) { end(r, t); return false; }
      r.blast.taken.add(key(nx, ny));
      r.p -= 1;
      r.gx = nx; r.gy = ny;
      r.run--;
      if (--r.split <= 0 && r.gen < 3) {
        // a side branch, alternating sides on the main arms
        r.side = r.gen === 0 ? (r.side === 1 ? 3 : 1) : rand() < 0.5 ? 1 : 3;
        branch(r.blast, r.gx, r.gy, (r.d + r.side) % 4, r.gen + 1);
        r.split = r.gen === 0 ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
      }
    }
    return true;
  }

  /* ---------- Build the quads ---------- */
  let q = 0;
  function quad(ax: number, ay: number, at: number, bx: number, by: number, bt: number, k: number, hw: number, lf: number) {
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
    }
    q++;
  }

  function build() {
    q = 0;
    const heads = new Map<Line, Pt>();
    for (const a of agents) heads.set(a.line, { x: a.gx + DIRS[a.d][0] * a.p, y: a.gy + DIRS[a.d][1] * a.p, t: now });
    for (const r of branches) heads.set(r.line, { x: r.gx + DIRS[r.d][0] * r.p, y: r.gy + DIRS[r.d][1] * r.p, t: now });
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
      const k = l.teal ? TEAL : INK;
      for (let i = 0; i < pts.length - 1; i++) {
        let a = pts[i];
        const b = pts[i + 1];
        if (a.t < cutoff && b.t > a.t) { // trim the faded part, so the tail fades smoothly
          const f = (cutoff - a.t) / (b.t - a.t);
          a = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, t: cutoff };
        }
        quad(sx(a.x), sy(a.y), a.t, sx(b.x), sy(b.y), b.t, k, 0.5, l.life);
      }
    }
    // marks: a small open square (a task done, or the pad at a branch end)
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i];
      if (m.t <= now - m.life) { marks.splice(i, 1); continue; }
      const x = sx(m.x), y = sy(m.y), s = 5;
      quad(x - s, y - s, m.t, x + s, y - s, m.t, TEAL, 0.5, m.life);
      quad(x + s, y - s, m.t, x + s, y + s, m.t, TEAL, 0.5, m.life);
      quad(x + s, y + s, m.t, x - s, y + s, m.t, TEAL, 0.5, m.life);
      quad(x - s, y + s, m.t, x - s, y - s, m.t, TEAL, 0.5, m.life);
    }
    // heads: tiny teal squares (a little smaller on blast branches)
    for (const [l, h] of heads) {
      const x = sx(h.x), y = sy(h.y);
      quad(x - 0.01, y, now, x + 0.01, y, now, HEAD, l.life === LIFE ? 2 : 1.5, LIFE);
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
    for (let i = branches.length - 1; i >= 0; i--) if (!grow(branches[i], dt)) branches.splice(i, 1);
    // once the blasts are done, any agents still missing walk in from the edges
    if (!branches.length && agents.length < wanted) {
      const a: Agent = { gx: 0, gy: 0, d: 0, p: 0, speed: SPEED * (0.85 + rand() * 0.3), line: { pts: [], teal: agents.length % 3 === 1, life: LIFE }, wait: 0, cool: 2 + rand() * 5 };
      reenter(a);
      agents.push(a);
    }
  }

  return {
    mesh,
    resize(w, h) {
      W = w; H = h;
      place();
      mat.uniforms.uView.value.set(W, H);
      build();
    },
    start(x, y) {
      // enough walking agents to cover the screen: about one per 275 × 275 px
      wanted = THREE.MathUtils.clamp(Math.round((W * H) / 75000), 5, 20);
      blast(x, y, o.mobile ? 26 : 60, true);
      build();
    },
    blast(x, y, n) { blast(x, y, n); },
    update(dt, i) {
      scroll = i.scrollY;
      place();
      cur.x = i.cursorX; cur.y = i.cursorY; cur.on = i.cursor;
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
