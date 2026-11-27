/* ==========================================================================
   Page orchestration: smooth scroll, loader, intro, reveals, nav, cursor,
   counters, typing, marquees, project cards, contact form, easter egg,
   and lazy-loading of the two 3D scenes.
   ========================================================================== */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initAgentChat } from './agent';
import { initComposeLinks, openCompose } from './compose';
import type { World, WorldInput } from './scene/world';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduced = root.classList.contains('reduced');
const noWebGL = root.classList.contains('no-webgl');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mobile = !finePointer || matchMedia('(max-width: 820px)').matches;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));

if (!reduced) root.classList.add('motion');

/* ---------- Shared input for the 3D world ---------- */
const input: WorldInput = { scrollY: window.scrollY, velocity: 0, mouseX: 0, mouseY: 0 };
let world: World | null = null;

/* ---------- Smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -70, duration: 1.2 }, autoRaf: false });
  lenis.on('scroll', () => ScrollTrigger.update());
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  revealIn(el);
  tuckNav();
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.2 });
  else el.scrollIntoView({ behavior: 'auto' });
}

/** Jumping to a section (nav, Hire me, the agent): start its reveal animations right away so the
 *  content (e.g. the contact form) is already in place when the scroll lands, instead of only
 *  starting to fade in once it arrives. The scroll-triggered reveals later find it done. */
function revealIn(section: Element | null) {
  if (!section || reduced) return;
  const opts = { duration: 0.8, ease: 'expo.out', delay: 0.35, overwrite: true } as const;
  gsap.to(section.querySelectorAll('[data-reveal]'), { ...opts, opacity: 1, y: 0, rotateX: 0, stagger: 0.04 });
  gsap.to(section.querySelectorAll('[data-split] .w'), { ...opts, yPercent: 0, rotate: 0, stagger: 0.04 });
  gsap.to(section.querySelectorAll('[data-script]'), { ...opts, clipPath: 'inset(-30% 0% -30% 0)' });
}
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
  const id = a?.getAttribute('href')?.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (target?.matches('[data-section]')) { revealIn(target); tuckNav(); }
}, true);

/** The top nav slides away while the page jumps to a section, so the section's header can sit right
 *  at the top of the screen; scrolling up afterwards brings the nav back as usual. */
let navTuckedUntil = 0;
function tuckNav() {
  navTuckedUntil = performance.now() + 1500;
  document.querySelector('[data-nav]')?.classList.add('is-hidden');
}

/* ---------- Loader ---------- */
// A small agent network pulses until fonts + page (+ the 3D world) are ready, then it
// spreads out across the screen (scatterLoader) while the backdrop fades.
const loadStart = performance.now();
const prog = { v: 0 };
let loadTarget = 0.35;
let finished = false;
function setProgress(t: number) {
  loadTarget = Math.max(loadTarget, t);
}
const progTick = () => {
  prog.v += (loadTarget - prog.v) * 0.12;
  const elapsed = performance.now() - loadStart;
  if (!finished && ((prog.v > 0.985 && elapsed > 1100) || elapsed > 2000)) finishLoading();
};
gsap.ticker.add(progTick);
document.fonts.ready.then(() => setProgress(0.7));
window.addEventListener('load', () => setProgress(noWebGL || reduced ? 1 : 0.85));

/** The loader's little network spreads out into the page: its nodes drift outward and sprout
 *  new ones (thin lines stretching between them) while everything fades, handing over to the
 *  real network in the background. */
function scatterLoader() {
  const cv = $<HTMLCanvasElement>('[data-loader-fx]');
  const svg = $<SVGSVGElement>('[data-loader-spinner] svg');
  const ctx = cv?.getContext('2d');
  if (!cv || !svg || !ctx || reduced) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.scale(dpr, dpr);
  const ink = root.dataset.theme === 'dark' ? '220,220,220' : '42,42,42';
  const ACC = '18,160,140';
  type N = { x0: number; y0: number; x1: number; y1: number; size: number; teal: boolean; delay: number };
  // read the graph from the SVG at its current (rotated) screen position, so the hand-off is seamless
  const nodes: N[] = [];
  svg.querySelectorAll<SVGCircleElement>('[data-n]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const sat = el.classList.contains('ld-n--sat');
    nodes[Number(el.dataset.n)] = { x0: r.left + r.width / 2, y0: r.top + r.height / 2, x1: 0, y1: 0, size: sat ? 1.5 : 2.4, teal: false, delay: 0 };
  });
  const edges = [...svg.querySelectorAll<SVGLineElement>('[data-e]')].map((l) => l.dataset.e!.split('-').map(Number) as [number, number]);
  const hub = nodes[0];
  if (!hub) return;
  Object.assign(hub, { x1: hub.x0, y1: hub.y0, size: 4.5, teal: true });
  const reach = Math.min(W, H) * (mobile ? 0.11 : 0.13); // how far the network spreads, per unit of loader radius
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    const dx = n.x0 - hub.x0, dy = n.y0 - hub.y0, len = Math.hypot(dx, dy) || 1;
    const k = (reach / len) * (3.2 + Math.random() * 2.2);
    n.x1 = hub.x0 + dx * k + (Math.random() - 0.5) * 50;
    n.y1 = hub.y0 + dy * k + (Math.random() - 0.5) * 50;
  }
  // each outer node sprouts children that branch off further out
  const base = nodes.length;
  for (let i = 1; i < base; i++) {
    for (let k = 0; k < (mobile ? 1 : 2); k++) {
      const p = nodes[i];
      const a = Math.atan2(p.y1 - hub.y0, p.x1 - hub.x0) + (Math.random() - 0.5) * 1.7;
      const d = reach * (0.7 + Math.random() * 1.1);
      nodes.push({ x0: p.x0, y0: p.y0, x1: p.x1 + Math.cos(a) * d, y1: p.y1 + Math.sin(a) * d, size: 1.2 + Math.random() * 1.1, teal: Math.random() < 0.2, delay: 0.06 + Math.random() * 0.14 });
      edges.push([i, nodes.length - 1]);
    }
  }
  const T = 1.45; // seconds (the loader hides itself at 1.7s)
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const t0 = performance.now();
  const step = (now: number) => {
    const t = (now - t0) / 1000;
    const fade = Math.max(0, 1 - t / T);
    ctx.clearRect(0, 0, W, H);
    if (fade <= 0) { cv.remove(); return; }
    const P = nodes.map((n) => {
      const k = ease(Math.min(1, Math.max(0, (t - n.delay) / (T * 0.75))));
      return [n.x0 + (n.x1 - n.x0) * k, n.y0 + (n.y1 - n.y0) * k];
    });
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${ink},${0.3 * fade * fade})`;
    ctx.beginPath();
    for (const [a, b] of edges) { ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); }
    ctx.stroke();
    nodes.forEach((n, i) => {
      ctx.fillStyle = `rgba(${n.teal ? ACC : ink},${(n.teal ? 1 : 0.85) * fade})`;
      ctx.beginPath();
      ctx.arc(P[i][0], P[i][1], n.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function finishLoading() {
  finished = true;
  setProgress(1);
  gsap.ticker.remove(progTick);
  scatterLoader();
  root.classList.add('loaded');
  intro();
}

/* ---------- Hero intro ---------- */
const heroChars = $$('.hero__title .ch');
const heroTitle = $('.hero__title');
const fanCards = $$('.fan__face');
if (!reduced) {
  gsap.set(heroChars, { yPercent: 115, rotateX: -80, opacity: 0, transformOrigin: '50% 100%' });
  gsap.set(heroTitle, { '--block': 0 });
  gsap.set('[data-intro]', { opacity: 0, y: 24 });
  gsap.set(fanCards, { opacity: 0, y: 120, scale: 0.7 });
}
let introPlayed = false;
function intro() {
  if (introPlayed || reduced) return;
  introPlayed = true;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.4 });
  tl.to(heroChars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.4, stagger: 0.055 })
    .to(heroTitle, { '--block': 1, duration: 1.3, ease: 'expo.inOut' }, 0.15)
    .to('[data-intro]', { opacity: 1, y: 0, duration: 1.1, stagger: 0.06 }, 0.5)
    .to(fanCards, { opacity: 1, y: 0, scale: 1, duration: 1.4, stagger: { each: 0.06, from: 'center' } }, 0.6);
}
// Reduced motion: no loader animation — reveal immediately (after intro() is defined).
if (reduced) finishLoading();

/* ---------- Scroll-driven reveals ---------- */
if (!reduced) {
  gsap.set('[data-reveal]', { y: 50 });
  gsap.set('[data-reveal="tilt"]', { y: 70, rotateX: -16, transformPerspective: 1200, transformOrigin: '50% 0%' });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotateX: 0, duration: 0.95, ease: 'expo.out', stagger: 0.06, overwrite: true }),
  });

  $$('[data-split]').forEach((h) => {
    const words = $$('.w', h);
    gsap.set(words, { yPercent: 110, rotate: 4 });
    ScrollTrigger.create({
      trigger: h, start: 'top 86%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.05, ease: 'expo.out', stagger: 0.06 }),
    });
    // slow cinematic drift while scrolling (desktop only — on phones it would push titles past the edge)
    if (!mobile) {
      gsap.fromTo(h, { x: () => window.innerWidth * 0.03 }, { x: () => -window.innerWidth * 0.03, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    }
  });
  $$('[data-script]').forEach((s) => {
    gsap.set(s, { clipPath: 'inset(-30% 100% -30% 0)' });
    ScrollTrigger.create({
      trigger: s, start: 'top 85%', once: true,
      onEnter: () => gsap.to(s, { clipPath: 'inset(-30% 0% -30% 0)', duration: 1.1, ease: 'power2.inOut', delay: 0.2 }),
    });
  });

  // Hero parallax as it leaves
  gsap.to('.hero__titlewrap', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(['.hero__left', '.hero__right'], { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: '20% top', end: '70% top', scrub: true } });
}

/* ---------- Experience rail + role toggles ---------- */
const xpProg = $('[data-xp-progress]');
if (xpProg) {
  ScrollTrigger.create({
    trigger: '[data-xp]', start: 'top 70%', end: 'bottom 60%',
    onUpdate: (st) => xpProg.style.setProperty('--p', String(reduced ? 1 : st.progress)),
  });
  if (reduced) xpProg.style.setProperty('--p', '1');
}
/* ---------- Counters ---------- */
$$('[data-count]').forEach((el) => {
  const to = parseFloat(el.dataset.count ?? '0');
  const dec = parseInt(el.dataset.decimals ?? '0', 10);
  if (reduced) return;
  el.textContent = (0).toFixed(dec);
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 2, ease: 'expo.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } });
    },
  });
});

/* ---------- Typing ---------- */
const typed = $('[data-typing]');
if (typed) {
  const words: string[] = JSON.parse(typed.dataset.typing ?? '[]');
  let wi = 0;
  if (reduced) {
    setInterval(() => { wi = (wi + 1) % words.length; typed.textContent = words[wi]; }, 3000);
  } else {
    const run = async () => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await wait(2600);
      for (;;) {
        await wait(1700);
        const cur = words[wi];
        for (let i = cur.length; i >= 0; i--) { typed.textContent = cur.slice(0, i); await wait(32); }
        wi = (wi + 1) % words.length;
        const nxt = words[wi];
        for (let i = 1; i <= nxt.length; i++) { typed.textContent = nxt.slice(0, i); await wait(65); }
      }
    };
    run();
  }
}

/* ---------- Marquees (speed reacts to scroll velocity) ---------- */
type MQ = { track: HTMLElement; x: number; speed: number; dir: number; w: number; on: boolean };
const marquees: MQ[] = $$('[data-marquee]').map((el) => {
  const track = $('.marquee__track', el)!;
  const m: MQ = { track, x: 0, speed: parseFloat(el.dataset.speed ?? '60'), dir: el.dataset.reverse === '1' ? 1 : -1, w: 0, on: true };
  new IntersectionObserver(([e]) => { m.on = e.isIntersecting; }).observe(el);
  return m;
});
const measureMarquees = () => marquees.forEach((m) => { m.w = (m.track.firstElementChild as HTMLElement).offsetWidth; });
measureMarquees();
document.fonts.ready.then(measureMarquees);

/* ---------- Nav: active section + mobile menu ---------- */
const navLinks = $$<HTMLAnchorElement>('[data-nav-link]');
const indicator = $('[data-nav-indicator]');
const navEl = $('[data-nav]');
function setActive(id: string | null) {
  // the phone bar's Home button counts as active while you're on the hero (id === null)
  navLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.navLink === (id ?? 'top'))));
  const a = navLinks.find((l) => l.dataset.navLink === id);
  if (indicator) {
    if (a) {
      indicator.style.opacity = '1';
      indicator.style.width = `${a.offsetWidth}px`;
      indicator.style.transform = `translateX(${a.offsetLeft}px)`;
    } else indicator.style.opacity = '0';
  }
  world?.focus(id);
}
const navIds = navLinks.map((a) => a.dataset.navLink!);
// sections without their own nav tab light up the closest one
const navAlias: Record<string, string> = { education: 'projects', services: 'contact', faq: 'contact', message: 'contact' };
$$('[data-section]').forEach((sec) => {
  const navId = navIds.includes(sec.id) ? sec.id : navAlias[sec.id] ?? null;
  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (st) => { if (st.isActive) setActive(navId); },
  });
});
// the hero counts as active from the very top of the page (so the phone bar's Home lights up there)
ScrollTrigger.create({ trigger: '[data-hero]', start: 'top bottom', end: 'bottom 55%', onToggle: (st) => { if (st.isActive) setActive(null); } });

/* ---------- Light / dark theme ---------- */
const themeBtns = $$<HTMLButtonElement>('[data-theme-toggle]');
function syncThemeButtons() {
  const dark = root.dataset.theme === 'dark';
  themeBtns.forEach((b) => {
    b.setAttribute('aria-pressed', String(dark));
    b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}
function setTheme(theme: 'light' | 'dark') {
  root.classList.add('theme-anim');
  root.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch { /* private mode: just this visit */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e0e0e' : '#ffffff');
  syncThemeButtons();
  world?.setTheme();
  setTimeout(() => root.classList.remove('theme-anim'), 500);
}
themeBtns.forEach((b) => b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));
syncThemeButtons();

// Hide the desktop nav when scrolling down fast, show on the way up
// (the mobile bottom bar always stays put).
let lastY = window.scrollY;
function navOnScroll(y: number) {
  if (!navEl) return;
  const dy = y - lastY;
  if (performance.now() < navTuckedUntil) { lastY = y; return; } // jumping to a section: keep it tucked away
  if (y > window.innerHeight * 0.8 && dy > 6) navEl.classList.add('is-hidden');
  else if (dy < -6 || y < 200) navEl.classList.remove('is-hidden');
  lastY = y;
}

/* ---------- Custom cursor with trail ---------- */
const cursor = $('.cursor');
const cur = { x: -100, y: -100, rx: -100, ry: -100 };
const trail = $$('.cursor__trail').map(() => ({ x: -100, y: -100 }));
const dotEl = $('.cursor__dot'), ringEl = $('.cursor__ring');
const trailEls = $$('.cursor__trail');
if (cursor && finePointer && root.classList.contains('has-cursor')) {
  window.addEventListener('pointermove', (e) => { cur.x = e.clientX; cur.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    cursor.classList.toggle('is-hover', !!t.closest('a, button, [data-pcard], input, textarea, label'));
    cursor.classList.toggle('is-dark', !!t.closest('[data-opaque], .agent, .footer'));
  });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => { cur.x = -100; cur.y = -100; });
}

/* ---------- Mouse for the 3D world + card picking ---------- */
// Hero cards don't link anywhere: hovering one flips it to its back (the flip itself is in the 3D scene).
// Hover follows any mouse or pen at every screen size; touch is handled separately below.
let pickX = -1, pickY = -1;
let pickBlocked = false; // pointer is on something in front of the cards (links, buttons, the name)
const wideHero = matchMedia('(min-width: 821px)'); // wide layout: the side text panels also sit in front of the cards
window.addEventListener('pointermove', (e) => {
  input.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  input.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
  if (e.pointerType === 'touch') return;
  pickX = e.clientX; pickY = e.clientY;
  pickBlocked = !!(e.target as Element | null)?.closest?.(wideHero.matches ? '.hero__title, .hero__left, .hero__right, a, button' : '.hero__title, a, button');
}, { passive: true });
document.documentElement.addEventListener('mouseleave', () => { pickX = -1; world?.pickCard(-1e5, -1e5); });
let hoveredCard: string | null = null;
// Touch has no hover, so a finger landing on a card stands in for it: the card flips straight away and stays
// flipped; touching another card flips that one instead, touching it again (or empty space) flips it back.
let pinnedCard: string | null = null;
let pinT = 0;
function pin(id: string | null) {
  pinnedCard = id;
  world?.pinCard(id);
  clearTimeout(pinT);
  if (id) pinT = window.setTimeout(() => pin(null), 6000); // flips back by itself after a while
}
const heroEl = $<HTMLElement>('[data-hero]');
// Swiping sideways on the hero moves the card strip (the hero is `touch-action: pan-y`, so up/down still
// scrolls the page); a flick keeps it gliding. Swiping lets go of a flipped card.
let swipe: { x: number; y: number; lx: number; lt: number; v: number; on: boolean } | null = null;
heroEl?.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || !e.isPrimary) return;
  swipe = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, v: 0, on: false };
  if ((e.target as HTMLElement).closest('a, button, input, textarea')) return;
  const id = world?.cardAt(e.clientX, e.clientY) ?? null;
  pin(id && id === pinnedCard ? null : id);
}, { passive: true });
heroEl?.addEventListener('pointermove', (e) => {
  if (!swipe || e.pointerType !== 'touch' || !e.isPrimary) return;
  if (!swipe.on) {
    const ax = Math.abs(e.clientX - swipe.x), ay = Math.abs(e.clientY - swipe.y);
    if (ax < 8 || ax < ay) return;
    swipe.on = true;
    pin(null);
  }
  const dx = e.clientX - swipe.lx, dt = Math.max(1, e.timeStamp - swipe.lt);
  swipe.v = swipe.v * 0.6 + (dx / dt) * 1000 * 0.4; // px/s, smoothed
  swipe.lx = e.clientX; swipe.lt = e.timeStamp;
  world?.dragStrip(dx);
}, { passive: true });
const endSwipe = (e: PointerEvent) => {
  if (!swipe || e.pointerType !== 'touch' || !e.isPrimary) return;
  if (swipe.on) world?.flingStrip(e.timeStamp - swipe.lt > 80 ? 0 : swipe.v); // finger rested before lifting: no glide
  swipe = null;
};
heroEl?.addEventListener('pointerup', endSwipe);
heroEl?.addEventListener('pointercancel', endSwipe);
// Big screens: shift + wheel (or a sideways trackpad swipe) over the hero scrolls the card strip
heroEl?.addEventListener('wheel', (e) => {
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
  if (!d) return;
  e.preventDefault();
  e.stopPropagation(); // keep it from Lenis (it would scroll the page)
  world?.pushStrip(d * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1));
}, { passive: false });

/* ---------- Project cards: tilt + flip ---------- */
$$('[data-pcard]').forEach((card) => {
  const tilt = $('.pcard__tilt', card)!;
  if (finePointer && !reduced) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tilt.style.setProperty('--rx', `${(0.5 - py) * 9}deg`);
      tilt.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
  }
  $$('[data-flip]', card).forEach((b) => b.addEventListener('click', () => {
    const flipped = card.dataset.flipped !== 'true';
    card.dataset.flipped = String(flipped);
    const front = $('[data-face="front"]', card), back = $('[data-face="back"]', card);
    if (front && back) {
      front.toggleAttribute('inert', flipped);
      back.toggleAttribute('inert', !flipped);
      setTimeout(() => $<HTMLButtonElement>('[data-flip]', flipped ? back : front)?.focus({ preventScroll: true }), 300);
    }
  }));
});

/* ---------- Copy email ---------- */
$$<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const text = b.dataset.copy ?? '';
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  b.classList.add('is-copied');
  b.setAttribute('aria-label', 'Email address copied');
  setTimeout(() => { b.classList.remove('is-copied'); b.setAttribute('aria-label', 'Copy email address'); }, 1800);
}));

/* ---------- Email links + contact form ---------- */
initComposeLinks(); // every mailto: link (Email me, the address, agent answers) opens the "Send with" menu
// every contact form on the page (the main one and the short one at the end) works the same way
$$<HTMLFormElement>('[data-form]').forEach((form) => form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('[data-form-status]', form)!;
  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();
  const firstBad = form.querySelector<HTMLInputElement>('input:invalid, textarea:invalid');
  if (!name || !email || !message || firstBad) {
    status.textContent = 'Please fill in your name, a valid email and a message.';
    (firstBad ?? form.querySelector<HTMLInputElement>('input'))?.focus();
    return;
  }
  // send animation: a data packet flies off the button
  const btn = $('.cform__send', form)!;
  const plane = $('[data-plane]', form);
  form.classList.remove('is-sent'); void form.offsetWidth; form.classList.add('is-sent');
  if (plane && !reduced) {
    const br = btn.getBoundingClientRect(), fr = form.getBoundingClientRect();
    gsap.fromTo(plane, { x: br.right - fr.left - 30, y: br.top - fr.top + br.height / 2 - 5, opacity: 1, scale: 1 },
      { x: fr.width + 60, y: -80, scale: 0.4, opacity: 0, duration: 1.1, ease: 'power3.in' });
  }
  const endpoint = form.dataset.endpoint;
  if (endpoint) {
    status.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      if (!res.ok) throw new Error(String(res.status));
      status.textContent = "Message sent. Thanks! I'll get back to you soon.";
      form.reset();
    } catch {
      status.textContent = `Couldn't send right now. Please email ${form.dataset.email} directly.`;
    }
  } else {
    // no form service set up: let the visitor pick Gmail / Outlook / their email app, all prefilled
    // (a bare mailto: often does nothing when the computer has no default email app)
    status.textContent = 'Your message is ready. Choose how to send it:';
    openCompose(btn, { to: form.dataset.email ?? '', subject: `Portfolio enquiry from ${name}`, body: `${message}\n\nFrom: ${name} (${email})` }, {
      copy: 'message',
      onPick: (how) => {
        status.textContent = how === 'copy'
          ? `Message copied. Paste it into an email to ${form.dataset.email}.`
          : `Opened ${how === 'gmail' ? 'Gmail' : how === 'outlook' ? 'Outlook' : 'your email app'} with your message ready. Just hit send.`;
      },
    });
  }
}));

/* ---------- Agent chat ---------- */
function highlight(id: string) {
  const sec = document.getElementById(id);
  if (sec) {
    sec.classList.remove('is-agent-highlight'); void sec.offsetWidth;
    sec.classList.add('is-agent-highlight');
    setTimeout(() => sec.classList.remove('is-agent-highlight'), 2700);
  }
  navLinks.filter((a) => a.dataset.navLink === id).forEach((link) => {
    link.classList.remove("is-pulse"); void link.offsetWidth; link.classList.add("is-pulse");
  });
  world?.focus(id);
}
initAgentChat({ reduced, highlight, goTo });

/* ---------- Easter egg: type "agent" ---------- */
const toast = $('[data-toast]');
let buf = '';
document.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, [contenteditable]') || e.key.length !== 1) return;
  buf = (buf + e.key.toLowerCase()).slice(-5);
  if (buf === 'agent') { buf = ''; packetStorm(); }
});
function packetStorm() {
  world?.storm();
  if (toast) {
    toast.textContent = '⚡ Agent mode: data packets everywhere';
    toast.classList.add('is-on');
    setTimeout(() => toast.classList.remove('is-on'), 2600);
  }
  if (reduced) return;
  // DOM packets streak across the screen (also works without WebGL)
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('span');
    d.className = 'storm-dot';
    document.body.appendChild(d);
    const y = Math.random() * window.innerHeight;
    const fromLeft = Math.random() > 0.5;
    gsap.fromTo(d, { x: fromLeft ? -20 : window.innerWidth + 20, y, scale: 0.5 + Math.random() },
      { x: fromLeft ? window.innerWidth + 20 : -20, y: y + (Math.random() - 0.5) * 300, duration: 0.9 + Math.random() * 0.9, delay: Math.random() * 0.6, ease: 'power2.inOut', onComplete: () => d.remove() });
  }
}

/* ---------- Sideways rows on phones (Skills, Education, Projects): drag with a mouse, dots show/move the position ---------- */
// One dot per child of the row. `autoplayMs` / `idleMs`: move to the next page by itself, and how long a press
// and hold keeps it still (autoplay block below).
type SwipeOpts = { autoplayMs?: number; idleMs?: number; pauseWhen?: () => boolean };
function swipeRow(row: HTMLElement | null, dots: HTMLButtonElement[], { autoplayMs = 0, idleMs = 15000, pauseWhen = () => false }: SwipeOpts = {}) {
  if (!row || !dots.length) return;
  const items = [...row.children] as HTMLElement[];
  const syncDots = () => {
    const mid = row.scrollLeft + row.clientWidth / 2;
    let best = 0;
    items.forEach((it, i) => { if (Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid) < Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - mid)) best = i; });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === best));
  };
  row.addEventListener('scroll', syncDots, { passive: true });
  syncDots();
  dots.forEach((d, i) => d.addEventListener('click', () => {
    const it = items[i];
    row.scrollTo({ left: it.offsetLeft - (row.clientWidth - it.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }));
  // mouse drag (touch already swipes natively)
  let sx = 0, sl = 0, down = false, moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || row.scrollWidth <= row.clientWidth) return;
    down = true; moved = false; sx = e.clientX; sl = row.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    if (!moved && Math.abs(e.clientX - sx) > 4) { moved = true; row.classList.add('is-dragging'); }
    if (moved) row.scrollLeft = sl - (e.clientX - sx);
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (!moved) return;
    row.classList.remove('is-dragging');
    // a drag that ends on a button or link shouldn't also press it (the click follows this pointerup straight away)
    const swallow = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    row.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => row.removeEventListener('click', swallow, { capture: true }), 0);
    // settle on the nearest card
    syncDots();
    dots.find((d) => d.classList.contains('is-on'))?.click();
  });
  // Autoplay: next page every `autoplayMs`, looping back to the first. It starts when the row scrolls into view
  // (half of it visible; the first move comes FIRST_MOVE_MS later) and stops when it leaves. The first automatic move always happens:
  // touches are ignored until then. After it, a press and hold (a finger kept still for HOLD_MS) or a sideways
  // swipe stops it for `idleMs` after letting go, and it never moves while a finger is down. A quick tap, or
  // scrolling the page up/down with a finger on the cards, doesn't stop it. Only on phones (the row scrolls
  // sideways) with the tab open; off for visitors who prefer reduced motion.
  if (autoplayMs && !reduced) {
    const HOLD_MS = 350, MOVE_PX = 12, FIRST_MOVE_MS = 500;
    let held = false, moved = false, swiped = false, pausedUntil = 0, sx = 0, sy = 0, holdT = 0, timer = 0, startT = 0;
    let armed = false; // true after the first automatic move; touches before that are ignored
    const scrollable = () => getComputedStyle(row).overflowX !== 'visible' && row.scrollWidth > row.clientWidth + 1;
    const next = () => {
      if ((armed && held) || Date.now() < pausedUntil || document.hidden || !scrollable() || pauseWhen()) return;
      const cur = Math.max(0, dots.findIndex((d) => d.classList.contains('is-on')));
      dots[(cur + 1) % dots.length].click();
      armed = true;
    };
    // the hold is caught with a timer while the finger is still down: phones often cancel a long touch (to start
    // text selection or a link menu) just before it ends, so timing it at release misses it
    const down = (x: number, y: number) => {
      held = true; moved = false; swiped = false; sx = x; sy = y;
      clearTimeout(holdT);
      holdT = window.setTimeout(() => { if (held && !moved && armed) pausedUntil = Infinity; }, HOLD_MS);
    };
    const move = (x: number, y: number) => {
      if (!held || moved || Math.hypot(x - sx, y - sy) <= MOVE_PX) return;
      moved = true; clearTimeout(holdT);
      swiped = Math.abs(x - sx) > Math.abs(y - sy); // sideways = swiping the row; up/down = scrolling the page
    };
    const up = () => {
      if (!held) return;
      held = false; clearTimeout(holdT);
      if (!armed) return;
      if (pausedUntil === Infinity || swiped) pausedUntil = Date.now() + idleMs; // a press and hold, or a swipe
    };
    // touch events (not pointer events): they keep coming while the browser scrolls the row under the finger
    row.addEventListener('touchstart', (e) => down(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    row.addEventListener('touchmove', (e) => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    row.addEventListener('touchend', up);
    row.addEventListener('touchcancel', up);
    row.addEventListener('contextmenu', (e) => { if (held && scrollable()) e.preventDefault(); }); // no long-press menu
    row.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') down(e.clientX, e.clientY); });
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY); });
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') up(); });
    // start when half the row is in view (first move FIRST_MOVE_MS later, then every interval); stop when it leaves
    new IntersectionObserver(([en]) => {
      clearInterval(timer); clearTimeout(startT);
      if (en.isIntersecting) startT = window.setTimeout(() => { next(); timer = window.setInterval(next, autoplayMs); }, FIRST_MOVE_MS);
    }, { threshold: 0.5 }).observe(row);
  }
}
// Phones: Skills, Projects and Education move on by themselves every 1.5s; a press and hold or a swipe stops it for 15s
const AUTOPLAY = { autoplayMs: 1500, idleMs: 15000 };
swipeRow($<HTMLElement>('[data-stack]'), $$<HTMLButtonElement>('[data-stack-dots] button'), AUTOPLAY);
swipeRow($<HTMLElement>('[data-edu]'), $$<HTMLButtonElement>('[data-edu-dots] button'), AUTOPLAY);
// (a project card turned to its Details side also stays put until it's turned back)
swipeRow($<HTMLElement>('[data-projects]'), $$<HTMLButtonElement>('[data-projects-dots] button'), {
  ...AUTOPLAY, pauseWhen: () => !!document.querySelector('[data-projects] [data-flipped="true"]'),
});

/* ---------- Skills: bento tiles ---------- */
// a soft spotlight follows the pointer inside each tile
$$<HTMLElement>('[data-tile]').forEach((tile) => {
  tile.addEventListener('pointermove', (e) => {
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
    tile.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
// "Ask the agent" tile opens the chat with a question
$$<HTMLButtonElement>('[data-ask]').forEach((b) => b.addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('agent:ask', { detail: b.dataset.ask }));
}));

/* ---------- Main 3D world (lazy, after first paint) ---------- */
const canvas = $<HTMLCanvasElement>('#world');
function bootWorld() {
  if (!canvas || noWebGL) return;
  import('./scene/world')
    .then((m) => m.createWorld({ canvas, input, reduced, mobile, photo: canvas.dataset.photo }))
    .then((w) => {
      world = w;
      root.classList.add('webgl-ready');
      setProgress(1);
    })
    .catch((err) => {
      console.warn('3D disabled:', err);
      root.classList.add('no-webgl');
      setProgress(1);
    });
}
if ('requestIdleCallback' in window) (window as any).requestIdleCallback(bootWorld, { timeout: 600 });
else setTimeout(bootWorld, 120);

/* ---------- Opaque sections cover the canvas → pause rendering ---------- */
const opaque = $$('[data-opaque]');
function canvasCovered() {
  const h = window.innerHeight;
  return opaque.some((el) => { const r = el.getBoundingClientRect(); return r.top <= 0 && r.bottom >= h; });
}

/* ---------- One ticker for everything ---------- */
let lastScroll = window.scrollY;
let tabHidden = document.hidden;
document.addEventListener('visibilitychange', () => { tabHidden = document.hidden; });
gsap.ticker.add((time, deltaMs) => {
  if (tabHidden) return;
  const dt = Math.min(0.05, deltaMs / 1000);
  const y = lenis ? lenis.scroll : window.scrollY;
  input.scrollY = y;
  input.velocity = lenis ? lenis.velocity : (y - lastScroll) / Math.max(dt, 0.001) / 60;
  lastScroll = y;
  navOnScroll(y);

  // marquees
  if (!reduced) {
    const v = Math.abs(input.velocity);
    for (const m of marquees) {
      if (!m.on || !m.w) continue;
      m.x += m.dir * (m.speed + Math.min(v * 4, 240)) * dt; // a gentle speed-up while scrolling
      if (m.x <= -m.w) m.x += m.w;
      if (m.x > 0) m.x -= m.w;
      m.track.style.transform = `translate3d(${m.x}px,0,0)`;
    }
  }

  // cursor
  if (cursor && dotEl && ringEl) {
    cur.rx += (cur.x - cur.rx) * 0.18;
    cur.ry += (cur.y - cur.ry) * 0.18;
    dotEl.style.transform = `translate3d(${cur.x}px,${cur.y}px,0)`;
    ringEl.style.transform = `translate3d(${cur.rx}px,${cur.ry}px,0)`;
    let px = cur.x, py = cur.y;
    trail.forEach((p, i) => {
      p.x += (px - p.x) * 0.38; p.y += (py - p.y) * 0.38;
      px = p.x; py = p.y;
      const el = trailEls[i];
      el.style.transform = `translate3d(${p.x}px,${p.y}px,0) scale(${1 - i / trail.length})`;
      el.style.opacity = String(0.45 * (1 - i / trail.length));
    });
  }

  // world
  if (world) {
    world.setPaused(canvasCovered());
    if (pickX >= 0 && y < window.innerHeight) {
      const id = pickBlocked ? world.pickCard(-1e5, -1e5) : world.pickCard(pickX, pickY);
      if (id !== hoveredCard) {
        hoveredCard = id;
        cursor?.classList.toggle('is-hover', !!id);
      }
    }
    world.tick(dt, time);
  }
});

/* ---------- Resize / layout changes ---------- */
let rzT = 0;
let lastW = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = window.setTimeout(() => {
    // ignore mobile URL-bar height jitter
    if (mobile && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    measureMarquees();
    ScrollTrigger.refresh();
    world?.relayout();
  }, 180);
});
document.fonts.ready.then(() => { ScrollTrigger.refresh(); world?.relayout(); });
window.addEventListener('load', () => { ScrollTrigger.refresh(); world?.relayout(); });
