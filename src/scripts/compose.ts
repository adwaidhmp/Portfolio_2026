/* "Send with" menu for every email action on the site.
   A plain mailto: link only works when the visitor's computer has a default email app, and many
   don't (it then silently does nothing). This menu offers Gmail and Outlook in the browser with
   the address, subject and message filled in, the email app (mailto:) and a copy button. */

export type Mail = { to: string; subject?: string; body?: string };
export type ComposeHow = 'gmail' | 'outlook' | 'app' | 'copy';

const enc = encodeURIComponent;

export function parseMailto(href: string): Mail {
  const [addr, query = ''] = href.replace(/^mailto:/i, '').split('?');
  const q = new URLSearchParams(query);
  return { to: decodeURIComponent(addr), subject: q.get('subject') ?? undefined, body: q.get('body') ?? undefined };
}

export function composeUrls({ to, subject = '', body = '' }: Mail) {
  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`,
    mailto: `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`,
  };
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back below */ }
  const ta = Object.assign(document.createElement('textarea'), { value: text });
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  return ok;
}

const ICONS: Record<ComposeHow, string> = {
  gmail: '<path d="M2.5 4.5h11v7h-11zM3 5l5 3.8L13 5" />',
  outlook: '<path d="M2.5 4.5h11v7h-11zM3 5l5 3.8L13 5" />',
  app: '<path d="M2 4h12v8H2zM2.5 4.5 8 9l5.5-4.5" />',
  copy: '<path d="M5.5 5.5h7v8h-7zM3.5 10.5v-8h7" />',
};

let current: { el: HTMLElement; off: () => void } | null = null;

export function closeCompose() {
  if (!current) return;
  const { el, off } = current;
  current = null;
  off();
  el.classList.remove('is-on');
  setTimeout(() => el.remove(), 200);
}

/** Opens the menu next to `anchor`. `copy` decides what the copy button copies (address or whole message). */
export function openCompose(anchor: Element, mail: Mail, opts: { copy?: 'address' | 'message'; onPick?: (how: ComposeHow) => void } = {}) {
  closeCompose();
  const urls = composeUrls(mail);
  const copyWhat = opts.copy ?? (mail.body ? 'message' : 'address');
  const el = document.createElement('div');
  el.className = 'compose';
  el.setAttribute('role', 'menu');
  el.setAttribute('aria-label', 'Send email with');
  el.innerHTML = '<p class="compose__title">Send with</p>';

  const touch = matchMedia('(hover: none)').matches; // phones usually have a mail app: list it first there
  const order: ComposeHow[] = touch ? ['app', 'gmail', 'outlook', 'copy'] : ['gmail', 'outlook', 'app', 'copy'];
  const labels: Record<ComposeHow, string> = {
    gmail: 'Gmail', outlook: 'Outlook', app: 'Email app',
    copy: copyWhat === 'message' ? 'Copy message' : 'Copy email address',
  };
  for (const how of order) {
    const isLink = how !== 'copy';
    const opt = document.createElement(isLink ? 'a' : 'button') as HTMLAnchorElement | HTMLButtonElement;
    opt.className = 'compose__opt';
    opt.setAttribute('role', 'menuitem');
    opt.innerHTML = `<span class="compose__ico" aria-hidden="true"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${ICONS[how]}</svg></span><span class="compose__label">${labels[how]}</span>${how === 'gmail' || how === 'outlook' ? '<span class="compose__hint">opens in a new tab</span>' : ''}`;
    if (isLink) {
      const a = opt as HTMLAnchorElement;
      a.href = how === 'gmail' ? urls.gmail : how === 'outlook' ? urls.outlook : urls.mailto;
      if (how !== 'app') { a.target = '_blank'; a.rel = 'noopener'; }
      a.addEventListener('click', () => { opts.onPick?.(how); setTimeout(closeCompose, 50); });
    } else {
      opt.addEventListener('click', async () => {
        const text = copyWhat === 'message'
          ? `To: ${mail.to}\nSubject: ${mail.subject ?? ''}\n\n${mail.body ?? ''}`
          : mail.to;
        const ok = await copyText(text);
        const label = opt.querySelector('.compose__label');
        if (label) label.textContent = ok ? 'Copied ✓' : 'Copy failed';
        opts.onPick?.('copy');
        setTimeout(closeCompose, 900);
      });
    }
    el.appendChild(opt);
  }
  document.body.appendChild(el);

  // place it under the anchor (or above when there's no room), kept inside the viewport
  const w = el.offsetWidth, h = el.offsetHeight, pad = 8;
  const place = () => {
    const r = anchor.getBoundingClientRect();
    const below = r.bottom + 8 + h < innerHeight - pad;
    el.style.left = `${Math.max(pad, Math.min(r.left, innerWidth - w - pad))}px`;
    el.style.top = `${below ? r.bottom + 8 : Math.max(pad, r.top - 8 - h)}px`;
    el.dataset.side = below ? 'below' : 'above';
    return r;
  };
  place();
  requestAnimationFrame(() => el.classList.add('is-on'));
  (el.querySelector('.compose__opt') as HTMLElement | null)?.focus({ preventScroll: true });

  const onDown = (e: PointerEvent) => { if (!el.contains(e.target as Node) && !anchor.contains(e.target as Node)) closeCompose(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); closeCompose(); (anchor as HTMLElement).focus?.({ preventScroll: true }); } };
  // follow the button while the page settles or scrolls a little; close once it scrolls off screen
  const onScroll = () => { const r = place(); if (r.bottom < 0 || r.top > innerHeight) closeCompose(); };
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', closeCompose);
  current = {
    el,
    off: () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', closeCompose);
    },
  };
}

/** Every mailto: link on the page opens the menu instead of relying on a default email app. */
export function initComposeLinks() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="mailto:"]');
    if (!a || a.closest('.compose')) return;
    e.preventDefault();
    if (current && current.el.dataset.for === a.href) { closeCompose(); return; }
    openCompose(a, parseMailto(a.href), { copy: 'address' });
    if (current) current.el.dataset.for = a.href;
  });
}
