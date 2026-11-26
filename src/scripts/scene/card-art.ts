/* Procedural artwork for the hero wheel cards (no image downloads). */
import type { CardSpec } from '../../data/cards';

export const CARD_W = 512;
export const CARD_H = 712;

const C = {
  accent: '#12a08c', // teal accent (same as --accent in global.css)
  black: '#111111',
  white: '#ffffff',
  grey: '#2a2a2a',
  muted: '#8a8a8a',
};
const BG: Record<CardSpec['bg'], string> = { accent: C.accent, black: C.black, white: C.white, grey: C.grey };
const FG: Record<CardSpec['bg'], string> = { accent: C.black, black: C.white, white: C.black, grey: C.white };
const DARK = (bg: CardSpec['bg']) => bg === 'black' || bg === 'grey';

const DISPLAY = '"Unbounded Variable", "Arial Black", sans-serif';
const MONO = '"JetBrains Mono Variable", monospace';
const SANS = '"Space Grotesk Variable", system-ui, sans-serif';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'right' | 'center' = 'left') {
  // letter-spacing that works in every browser
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  w -= spacing;
  let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, start: number, weight = 900, family = DISPLAY) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > 12) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang) * size, y + Math.sin(ang) * size);
  ctx.lineTo(x + Math.cos(ang + 2.5) * size, y + Math.sin(ang + 2.5) * size);
  ctx.lineTo(x + Math.cos(ang - 2.5) * size, y + Math.sin(ang - 2.5) * size);
  ctx.closePath();
  ctx.fill();
}

export function drawCard(spec: CardSpec, index: number, total: number, photo?: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = CARD_W;
  cv.height = CARD_H;
  const ctx = cv.getContext('2d')!;
  // With a photo, the profile card becomes a dark portrait poster whatever its colour in cards.ts
  const photoCard = spec.motif === 'profile' && !!photo;
  const dark = photoCard || DARK(spec.bg);
  const bg = photoCard ? C.black : BG[spec.bg];
  const fg = photoCard ? C.white : FG[spec.bg];
  const acc = spec.bg === 'accent' ? C.black : C.accent; // accent that always contrasts with the card
  const P = 34; // padding

  rr(ctx, 0, 0, CARD_W, CARD_H, 40);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = bg; // flat colours: simple
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // subtle print grain
  const rnd = seeded(index * 97 + 13);
  ctx.globalAlpha = dark ? 0.06 : 0.05;
  ctx.fillStyle = dark ? '#fff' : '#000';
  for (let i = 0; i < 2600; i++) ctx.fillRect(rnd() * CARD_W, rnd() * CARD_H, 1.4, 1.4);
  ctx.globalAlpha = 1;

  const cx = CARD_W / 2;
  const midY = CARD_H * 0.45;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (spec.motif) {
    case 'profile': {
      if (photo) {
        // portrait fills the card (cover-fit, anchored to the top so the face stays in frame)
        const ar = photo.width / photo.height;
        let w = CARD_W, h = CARD_W / ar;
        if (h < CARD_H) { h = CARD_H; w = CARD_H * ar; }
        ctx.save();
        ctx.filter = 'contrast(1.05) saturate(0.92)';
        ctx.drawImage(photo, (CARD_W - w) / 2, 0, w, h);
        ctx.restore();
        // soft shade at the top and bottom so the white type reads
        let g = ctx.createLinearGradient(0, 0, 0, 170);
        g.addColorStop(0, 'rgba(17,17,17,0.6)');
        g.addColorStop(1, 'rgba(17,17,17,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, CARD_W, 170);
        g = ctx.createLinearGradient(0, CARD_H * 0.5, 0, CARD_H);
        g.addColorStop(0, 'rgba(17,17,17,0)');
        g.addColorStop(0.55, 'rgba(17,17,17,0.72)');
        g.addColorStop(1, 'rgba(17,17,17,0.96)');
        ctx.fillStyle = g;
        ctx.fillRect(0, CARD_H * 0.5, CARD_W, CARD_H * 0.5);
      } else {
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.arc(cx, midY - 10, 170, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.black; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, midY - 10, 200, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.black;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fitFont(ctx, 'AM', 300, 220);
        ctx.fillText('AM', cx, midY - 6);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = fg;
      ctx.font = `700 19px ${DISPLAY}`;
      spaced(ctx, 'AI/ENG', CARD_W - P - 2, P + 22, 2, 'right');
      spaced(ctx, 'MMXXVI', CARD_W - P - 2, P + 46, 2, 'right');
      break;
    }

    case 'py': {
      // Python: big offset "PY" + a REPL line
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 220px ${DISPLAY}`;
      ctx.lineWidth = 3; ctx.strokeStyle = fg;
      ctx.strokeText('PY', cx + 14, midY - 26);
      ctx.fillStyle = acc;
      ctx.fillText('PY', cx - 6, midY - 46);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = `500 26px ${MONO}`;
      ctx.fillStyle = fg;
      ctx.fillText('>>> import agents', P, 520);
      ctx.fillText('>>> agents.run(task)', P, 562);
      ctx.fillStyle = acc;
      ctx.fillText("'done ✓'", P, 604);
      break;
    }

    case 'spark': {
      // LLM APIs: a burst of rays
      ctx.strokeStyle = acc;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + 0.05;
        const r0 = 40, r1 = 120 + (i % 3) * 45 + rnd() * 25;
        ctx.lineWidth = i % 2 ? 6 : 11;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, midY - 20 + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, midY - 20 + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(cx, midY - 20, 22, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'bolt': {
      // FastAPI: lightning bolt in a disc, with speed lines
      const y0 = midY - 20;
      ctx.strokeStyle = fg; ctx.lineWidth = 3;
      ctx.setLineDash([10, 14]);
      ctx.beginPath(); ctx.arc(cx, y0, 196, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(cx, y0, 158, 0, Math.PI * 2); ctx.fill();
      const bolt: [number, number][] = [[28, -122], [-78, 18], [-8, 18], [-32, 124], [78, -24], [8, -24]];
      ctx.fillStyle = C.accent; // teal bolt on the dark disc
      ctx.beginPath();
      bolt.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, y0 + y) : ctx.moveTo(cx + x, y0 + y)));
      ctx.closePath(); ctx.fill();
      break;
    }

    case 'queue': {
      // Celery / Redis / RabbitMQ: three task lanes converging on a worker
      const lanes = [170, 280, 390];
      const wx = 412, wy = 280;
      lanes.forEach((ly, i) => {
        for (let k = 0; k < 4; k++) {
          const x = 44 + k * 58;
          rr(ctx, x, ly - 22, 44, 44, 10);
          if (k === (i + 1) % 4) { ctx.fillStyle = acc; ctx.fill(); }
          ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(280, ly); ctx.lineTo(wx - 62, wy + (ly - wy) * 0.25); ctx.stroke();
        ctx.fillStyle = fg;
        arrowHead(ctx, wx - 62, wy + (ly - wy) * 0.25, Math.atan2((ly - wy) * 0.25 - (ly - wy), wx - 62 - 280), 12);
      });
      // worker gear
      ctx.fillStyle = fg;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.save(); ctx.translate(wx + Math.cos(a) * 54, wy + Math.sin(a) * 54); ctx.rotate(a);
        ctx.fillRect(-9, -9, 18, 18); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(wx, wy, 54, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = acc;
      ctx.beginPath(); ctx.arc(wx, wy, 26, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'graph': {
      // LangGraph: a directed agent graph
      const pts: [number, number][] = [[cx, 120], [150, 250], [362, 250], [cx, 380], [130, 420], [382, 430]];
      const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 4]];
      ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineWidth = 3;
      for (const [a, b] of links) {
        const [x1, y1] = pts[a], [x2, y2] = pts[b];
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        arrowHead(ctx, (x1 + x2) / 2, (y1 + y2) / 2, Math.atan2(y2 - y1, x2 - x1), 12);
      }
      pts.forEach(([x, y], i) => {
        ctx.fillStyle = i === 3 ? acc : fg;
        ctx.beginPath(); ctx.arc(x, y, i === 3 ? 34 : 24, 0, Math.PI * 2); ctx.fill();
        if (i === 3) { ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.stroke(); }
      });
      break;
    }

    case 'rings': {
      // RAG / vector search: concentric similarity rings
      ctx.strokeStyle = fg;
      for (let i = 1; i <= 7; i++) {
        ctx.lineWidth = i === 7 ? 3 : 1.5;
        ctx.beginPath(); ctx.arc(cx, midY - 10, i * 30, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.fillStyle = i % 4 === 0 ? acc : fg;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 210, midY - 10 + Math.sin(a) * 210, i % 4 === 0 ? 10 : 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = acc;
      ctx.beginPath(); ctx.arc(cx, midY - 10, 26, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'cloud': {
      // Docker + AWS: a cloud over a stack of containers
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.arc(cx - 72, 170, 42, 0, Math.PI * 2);
      ctx.arc(cx, 142, 60, 0, Math.PI * 2);
      ctx.arc(cx + 72, 170, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 114, 168, 228, 44);
      const rows: number[][] = [[cx - 60], [cx - 125, cx + 5], [cx - 190, cx - 60, cx + 70]];
      rows.forEach((xs, ri) => xs.forEach((x, k) => {
        const y = 262 + ri * 70;
        rr(ctx, x, y, 120, 58, 6);
        if (ri === 1 && k === 1) { ctx.fillStyle = acc; ctx.fill(); }
        ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
        for (let r = x + 16; r < x + 110; r += 14) { ctx.beginPath(); ctx.moveTo(r, y + 10); ctx.lineTo(r, y + 48); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }));
      break;
    }

    case 'db': {
      // SQL databases: stacked cylinder
      const rx = 150, ry = 38, top = 118, h = 80;
      for (let i = 2; i >= 0; i--) {
        const y = top + i * h;
        const fill = i === 1 ? acc : bg;
        ctx.beginPath();
        ctx.moveTo(cx - rx, y);
        ctx.lineTo(cx - rx, y + h - 16);
        ctx.ellipse(cx, y + h - 16, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(cx + rx, y);
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = fg;
      ctx.font = `500 24px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('SELECT * FROM tasks;', cx, 470);
      ctx.textAlign = 'left';
      break;
    }

    case 'jsx': {
      // React + Redux: a component
      const lines: [string, string][] = [
        [C.muted, '// React + Redux Toolkit'],
        [acc, 'export const Chat = () => {'],
        [fg, '  const msgs = useSelector('],
        [fg, '    (s) => s.agent.msgs)'],
        [acc, '  return ('],
        [fg, '    <Stream data={msgs} />'],
        [acc, '  )'],
        [acc, '}'],
      ];
      ctx.font = `500 23px ${MONO}`;
      lines.forEach(([col, t], i) => { ctx.fillStyle = col; ctx.fillText(t, P, 112 + i * 44); });
      ctx.fillStyle = acc; ctx.fillRect(P + 30, 112 + 7 * 44 - 20, 13, 26);
      break;
    }

    case 'stack': {
      // Django + DRF: the request layers
      const layers = ['URLS', 'VIEWSETS', 'SERIALIZERS', 'MODELS · ORM', 'POSTGRESQL'];
      layers.forEach((t, i) => {
        const w = 300 + i * 26, y = 98 + i * 72;
        rr(ctx, cx - w / 2, y, w, 54, 27);
        const solid = i === 2;
        if (solid) { ctx.fillStyle = fg; ctx.fill(); }
        ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = solid ? bg : fg; // the highlighted layer: card colour on the solid bar (always readable)
        ctx.font = `700 18px ${DISPLAY}`;
        ctx.textBaseline = 'middle';
        spaced(ctx, t, cx, y + 28, 2, 'center');
        ctx.textBaseline = 'alphabetic';
        if (i < layers.length - 1) { ctx.fillStyle = fg; arrowHead(ctx, cx, y + 63, Math.PI / 2, 8); }
      });
      break;
    }

    case 'mcp': {
      // MCP: product <-> MCP <-> assistants
      const nodes: [number, number, string][] = [[110, 150, 'CLAUDE'], [402, 150, 'CHATGPT'], [110, 400, 'DESKLOG'], [402, 400, 'CRM']];
      ctx.strokeStyle = fg; ctx.lineWidth = 2;
      for (const [x, y] of nodes) { ctx.beginPath(); ctx.moveTo(cx, 275); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [x, y, t] of nodes) {
        rr(ctx, x - 66, y - 24, 132, 48, 24);
        ctx.fillStyle = bg; ctx.fill(); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = `700 15px ${DISPLAY}`;
        ctx.fillText(t, x, y + 1);
      }
      ctx.fillStyle = acc;
      ctx.beginPath(); ctx.arc(cx, 275, 56, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = spec.bg === 'accent' ? C.white : C.black; ctx.font = `900 22px ${DISPLAY}`;
      ctx.fillText('MCP', cx, 277);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      break;
    }
  }
  ctx.restore();

  // Header + footer typography (poster style)
  ctx.fillStyle = fg;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `600 17px ${DISPLAY}`;
  spaced(ctx, spec.label.toUpperCase(), P, P + 22, 2.2);
  if (spec.motif !== 'profile') {
    ctx.font = `600 17px ${MONO}`;
    ctx.fillText(`${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`, CARD_W - P - 62, P + 22);
  }

  if (spec.big && spec.motif !== 'py' && spec.motif !== 'profile') {
    ctx.fillStyle = fg;
    fitFont(ctx, spec.big, CARD_W - P * 2, 150);
    ctx.fillText(spec.big, P - 4, CARD_H - P - 46);
  }
  if (spec.motif === 'profile') {
    ctx.fillStyle = fg;
    ctx.font = `800 40px ${DISPLAY}`;
    ctx.fillText('ADWAIDH MP', P, CARD_H - P - 46);
  }
  if (spec.sub) {
    ctx.fillStyle = photoCard ? C.accent : spec.bg === 'accent' ? 'rgba(17,17,17,0.72)' : dark ? C.muted : '#5a5a5a';
    ctx.font = `600 16px ${DISPLAY}`;
    spaced(ctx, spec.sub.toUpperCase(), P, CARD_H - P - 6, 2);
  }
  // registration crosshair
  ctx.strokeStyle = fg; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
  const hx = CARD_W - P - 8, hy = CARD_H - P - 14;
  ctx.beginPath(); ctx.moveTo(hx - 9, hy); ctx.lineTo(hx + 9, hy); ctx.moveTo(hx, hy - 9); ctx.lineTo(hx, hy + 9); ctx.stroke();
  ctx.globalAlpha = 1;
  // hairline edge so dark cards read on a dark page and white cards on a white page
  rr(ctx, 1.5, 1.5, CARD_W - 3, CARD_H - 3, 39);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2; ctx.stroke();
  return cv;
}

/** Soft drop shadow drawn with the shadowBlur trick (works in every browser, unlike ctx.filter). */
export function drawShadow(): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 320;
  const ctx = cv.getContext('2d')!;
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetX = 1000;
  rr(ctx, 40 - 1000, 40, 176, 240, 22);
  ctx.fillStyle = '#000';
  ctx.fill();
  return cv;
}

/** Word-wrap `text` to `maxW` using the current ctx.font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = word; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export type CardAbout = { headline: string; text: string; keywords: string[]; foot: string };

/** Back of a hero card (it flips on hover): "where I've used it" for tech cards, a short "about me"
 *  with search keywords for the profile card. Same poster language as the fronts. */
export function drawCardBack(spec: CardSpec, index: number, total: number, about?: CardAbout, touch = false): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = CARD_W;
  cv.height = CARD_H;
  const ctx = cv.getContext('2d')!;
  const isProfile = spec.motif === 'profile' && !!about;
  const key: CardSpec['bg'] = isProfile ? 'black' : spec.bg;
  const fg = FG[key];
  const dark = DARK(key);
  const acc = key === 'accent' ? C.black : C.accent;
  const soft = key === 'accent' ? 'rgba(17,17,17,0.78)' : dark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,17,0.74)';
  const P = 36;
  const W = CARD_W - P * 2;
  const pad = (n: number) => String(n).padStart(2, '0');

  rr(ctx, 0, 0, CARD_W, CARD_H, 40);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = BG[key];
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  // faint grid: a "spec sheet" feel
  ctx.globalAlpha = dark ? 0.06 : 0.07;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1;
  for (let x = P; x < CARD_W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke(); }
  for (let y = P; y < CARD_H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 17px ${MONO}`;
  ctx.fillStyle = acc;
  spaced(ctx, isProfile ? 'ABOUT ME' : "WHERE I'VE USED IT", P, P + 22, 1.5);
  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.6;
  ctx.fillText(`${pad(index + 1)}/${pad(total)}`, CARD_W - P - 62, P + 22);
  ctx.globalAlpha = 1;

  let y = P + 48;
  ctx.fillStyle = fg;
  if (isProfile) {
    ctx.font = `800 46px ${DISPLAY}`;
    for (const l of wrap(ctx, about!.headline.toUpperCase(), W)) { y += 50; ctx.fillText(l, P - 2, y); }
  } else {
    const title = spec.motif === 'py' ? spec.label.toUpperCase() : spec.big ?? spec.label.toUpperCase();
    fitFont(ctx, title, W, 64, 900);
    y += 62;
    ctx.fillText(title, P - 3, y);
  }
  y += 24;
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(CARD_W - P, y); ctx.stroke();
  ctx.globalAlpha = 1;
  y += 14;

  if (isProfile) {
    ctx.font = `500 27px ${SANS}`;
    ctx.fillStyle = soft;
    for (const l of wrap(ctx, about!.text, W)) { y += 35; ctx.fillText(l, P, y); }
    y += 28;
    // keyword chips
    ctx.font = `600 19px ${SANS}`;
    const chH = 38;
    let x = P;
    for (const k of about!.keywords) {
      const w = ctx.measureText(k).width + 28;
      if (x + w > CARD_W - P) { x = P; y += chH + 10; }
      rr(ctx, x, y, w, chH, chH / 2);
      ctx.strokeStyle = 'rgba(18,160,140,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = fg;
      ctx.fillText(k, x + 14, y + 26);
      x += w + 8;
    }
    ctx.font = `600 16px ${MONO}`;
    ctx.fillStyle = acc;
    spaced(ctx, about!.foot.toUpperCase(), P, CARD_H - P - 6, 1.2);
  } else {
    for (const it of spec.back ?? []) {
      y += 38;
      ctx.font = `700 18px ${DISPLAY}`;
      ctx.fillStyle = acc;
      spaced(ctx, it.where.toUpperCase(), P, y, 1.5);
      ctx.font = `500 30px ${SANS}`;
      ctx.fillStyle = fg;
      for (const l of wrap(ctx, it.what, W)) { y += 38; ctx.fillText(l, P, y); }
      y += 12;
    }
    ctx.font = `600 16px ${MONO}`;
    ctx.fillStyle = acc;
    spaced(ctx, touch ? 'TAP AGAIN TO EXPLORE  ↗' : 'CLICK TO EXPLORE  ↗', P, CARD_H - P - 6, 1.2);
  }
  rr(ctx, 1.5, 1.5, CARD_W - 3, CARD_H - 3, 39);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  return cv;
}
