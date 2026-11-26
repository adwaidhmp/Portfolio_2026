/* "Ask my AI agent" — a terminal-style chat that answers only from the
   portfolio data, using keyword matching. No API keys, so it never breaks. */
import { profile, about, skills, experience, projects, education, contact } from '../data/portfolio';

type Seg = { text: string; href?: string };
type Answer = { tool: string; result: string; segs: Seg[]; section?: string; sectionLabel?: string };
type Key = string | [string, number];
type Intent = { id: string; keys: Key[]; answer: () => Answer };

const T = (text: string, href?: string): Seg => ({ text, href });
const current = experience.find((r) => r.current) ?? experience[0];
const cat = (id: string) => skills.find((c) => c.id === id);

const intents: Intent[] = [
  {
    id: 'ai-systems',
    keys: ['ai system', 'systems', 'built', 'build', 'agent', 'agents', 'autonomous', 'coding agent', 'production', 'what has', 'made', 'llm'],
    answer: () => ({
      tool: 'get_experience(company="Desklog", tag="ai")',
      result: '4 production systems',
      section: 'experience', sectionLabel: 'Experience',
      segs: [T(
        `At ${current.companyNote ?? current.company}, Adwaidh has shipped 4 production AI systems:\n` +
        '① An autonomous coding agent on the Claude API that picks up assigned tasks, writes the code and completes them end to end.\n' +
        '② MCP servers for Desklog and Desklog CRM, so Claude and ChatGPT can read and act on product data.\n' +
        '③ An in-app agentic chat with MCP tool calling — it answers live data questions ("who is absent today?") and runs actions from plain language.\n' +
        "④ A Claude Code & OpenAI Codex plugin that tracks developers' AI usage.\n" +
        'Outside work: a hybrid RAG + LangGraph knowledge assistant in his FitAI platform.',
      )],
    }),
  },
  {
    id: 'mcp',
    keys: [['mcp', 4], 'model context', 'protocol', 'tool calling', 'tool call', 'tools', 'chatgpt', 'claude'],
    answer: () => ({
      tool: 'search_portfolio(query="MCP")',
      result: '3 matches',
      section: 'experience', sectionLabel: 'Experience',
      segs: [T(
        'MCP is core to his work. He built 2 MCP servers — for Desklog and Desklog CRM — exposing tools so Claude and ChatGPT (including their web apps) can read and act on product data. ' +
        'He also built an in-app agentic chat that uses MCP tool calling to answer questions from live data and perform actions from natural-language commands.',
      )],
    }),
  },
  {
    id: 'backend',
    keys: [['backend', 3], 'laravel', 'php', 'saas', 'tenant', 'database', 'indexing', 'caching', 'rest api', 'load balanc'],
    answer: () => ({
      tool: 'search_portfolio(query="backend")',
      result: `${experience.length} roles`,
      section: 'experience', sectionLabel: 'Experience',
      segs: [T(
        `At ${current.companyNote ?? current.company} he works on the backend of a multi-tenant time-tracking SaaS used worldwide — mainly Laravel and PHP on a distributed, load-balanced architecture. ` +
        'He builds backend features and REST APIs, with a focus on database optimization, indexing and caching for concurrent tenant workloads.\n' +
        'Before that, at Bridgeon, he built REST APIs and services with Django, DRF and FastAPI (auth, role-based access), Celery + RabbitMQ background jobs and Redis caching.',
      )],
    }),
  },
  {
    id: 'devops',
    keys: [['devops', 4], 'deploy', 'docker', 'aws', 'ec2', 'rds', 's3', 'cloudflare', 'contabo', 'pm2', 'nginx', 'reverse proxy', 'linux', 'server', 'hosting', 'cloud', 'ci cd', 'cron'],
    answer: () => ({
      tool: 'list_skills(group="devops")',
      result: `${cat('devops')?.skills.length ?? 0} skills`,
      section: 'skills', sectionLabel: 'Skills',
      segs: [T(
        'He ships and runs his own services: Docker containers deployed on AWS (EC2, RDS, S3), Cloudflare and Contabo — Linux servers with Nginx as a reverse proxy, Gunicorn and PM2 for the app processes, cron jobs for scheduled work, and CI/CD pipelines.\n' +
        `At ${current.companyNote ?? current.company} he handles deployments on AWS, Cloudflare and Contabo; at Bridgeon he containerized services with Docker and deployed them on AWS with Nginx, Gunicorn and CI/CD.`,
      )],
    }),
  },
  {
    id: 'integrations',
    keys: [['integration', 4], ['slack', 3], ['google', 3], 'calendar', 'google chat', 'third party'],
    answer: () => ({
      tool: 'search_portfolio(query="integrations")',
      result: '3 integrations',
      section: 'experience', sectionLabel: 'Experience',
      segs: [T(
        `At ${current.companyNote ?? current.company} he built external integrations with Slack, Google Calendar and Google Chat.\n` +
        'On the AI side, his MCP servers connect Desklog and Desklog CRM to Claude and ChatGPT, so they can read and act on product data.',
      )],
    }),
  },
  {
    id: 'stack',
    keys: ['stack', 'tech', 'skill', 'skills', 'technolog', 'language', 'framework', 'python', 'django', 'fastapi', 'react', 'docker', 'aws', 'know'],
    answer: () => ({
      tool: 'list_skills(group_by="category")',
      result: `${skills.reduce((n, c) => n + c.skills.length, 0)} skills · ${skills.length} clusters`,
      section: 'skills', sectionLabel: 'Skills',
      segs: [T(
        `AI & agentic: ${cat('ai')?.skills.join(', ')}.\n` +
        `Backend: ${cat('lang')?.skills.join(', ')} · ${cat('backend')?.skills.join(', ')}.\n` +
        `Async & realtime: ${[...(cat('async')?.skills ?? []), ...(cat('realtime')?.skills ?? [])].join(', ')}.\n` +
        `Frontend & data: ${cat('frontend')?.skills.join(', ')}.\n` +
        `DevOps: ${cat('devops')?.skills.join(', ')}.`,
      )],
    }),
  },
  {
    id: 'relocation',
    keys: [['relocat', 3], ['gcc', 3], 'dubai', 'uae', 'saudi', 'qatar', 'oman', 'kuwait', 'bahrain', 'abroad', 'move', 'remote', 'location', 'where', 'based', 'live', 'visa'],
    answer: () => ({
      tool: 'get_profile(fields=["location","relocation"])',
      result: 'ok',
      section: 'contact', sectionLabel: 'Contact',
      segs: [T(`Yes. Adwaidh is based in ${profile.location} and is open to relocation, including the GCC. He's also open to remote roles and freelance projects.`)],
    }),
  },
  {
    id: 'contact',
    keys: ['contact', 'email', 'mail', 'phone', 'call', 'reach', 'linkedin', 'github', 'number', 'message', 'touch'],
    answer: () => ({
      tool: 'get_contact()',
      result: '4 channels',
      section: 'contact', sectionLabel: 'Contact',
      segs: [
        T('Email: '), T(contact.email, `mailto:${contact.email}`),
        T('\nPhone: '), T(contact.phone, contact.phoneHref),
        T('\nGitHub: '), T('github.com/adwaidhmp', contact.github),
        T('\nLinkedIn: '), T('adwaidh-mp-', contact.linkedin),
        T('\nOr use the form in the contact section — he usually replies within a day.'),
      ],
    }),
  },
  {
    id: 'hire',
    keys: ['hire', 'hiring', 'freelance', 'available', 'availability', 'open to', 'job', 'role', 'notice', 'join', 'opportunit', 'recruit'],
    answer: () => ({
      tool: 'get_availability()',
      result: 'available',
      section: 'contact', sectionLabel: 'Contact',
      segs: [T(`${profile.availability}.\nBest way to start: `), T(contact.email, `mailto:${contact.email}`)],
    }),
  },
  {
    id: 'experience',
    keys: ['experience', 'years', 'work history', 'company', 'desklog', 'bridgeon', 'intern', 'career', 'worked', 'employ'],
    answer: () => ({
      tool: 'get_experience()',
      result: `${experience.length} roles`,
      section: 'experience', sectionLabel: 'Experience',
      segs: [T(
        `${about.highlights[0].value}+ years hands-on.\n` +
        experience.map((r) => `• ${r.title} — ${r.company}${r.companyNote ? ` (${r.companyNote})` : ''}, ${r.start} – ${r.end}`).join('\n'),
      )],
    }),
  },
  {
    id: 'projects',
    keys: ['project', 'fitai', 'fitness', 'nutrition', 'portfolio', 'repo', 'side', 'webrtc', 'github repo'],
    answer: () => ({
      tool: 'list_projects()',
      result: `${projects.length} items`,
      section: 'projects', sectionLabel: 'Projects',
      segs: [
        T(`${projects[0].title}: ${projects[0].summary}\nCode: `),
        ...projects[0].links.flatMap((l, i) => [T(i ? ' · ' : ''), T(l.label, l.href)]),
        T('\nNext up: a new Python agentic AI project — in progress.'),
      ],
    }),
  },
  {
    id: 'rag',
    keys: ['rag', 'langgraph', 'langchain', 'chroma', 'retrieval', 'hallucinat', 'vector', 'embedding', 'classifier'],
    answer: () => ({
      tool: 'search_portfolio(query="RAG LangGraph")',
      result: '2 matches',
      section: 'projects', sectionLabel: 'Projects',
      segs: [T(
        'His FitAI platform has a hybrid AI knowledge assistant: a FastAPI service with SVC intent and safety classifiers, RAG (LangChain + ChromaDB) and LangGraph. ' +
        'The LLM is only called after the ML and retrieval checks pass — a deliberate design to prevent hallucinations.',
      )],
    }),
  },
  {
    id: 'education',
    keys: ['education', 'degree', 'bca', 'university', 'college', 'certif', 'study', 'studied', 'course', 'qualification'],
    answer: () => ({
      tool: 'get_education()',
      result: `${education.length} records`,
      section: 'education', sectionLabel: 'Education',
      segs: [T(education.map((e) => `• ${e.title} — ${e.org} (${e.period})`).join('\n'))],
    }),
  },
  {
    id: 'resume',
    keys: ['resume', 'cv', 'pdf', 'download'],
    answer: () => ({
      tool: 'get_file("resume.pdf")',
      result: 'found',
      segs: [T('Here you go: '), T('Download resume (PDF)', profile.resume)],
    }),
  },
  {
    id: 'about',
    keys: ['who is', 'who are', 'about him', 'about adwaidh', 'summary', 'yourself', 'introduce', 'background', 'adwaidh', 'profile'],
    answer: () => ({
      tool: 'get_profile()',
      result: 'ok',
      section: 'about', sectionLabel: 'About',
      segs: [T(about.summary)],
    }),
  },
  {
    id: 'hello',
    keys: ['hi', 'hello', 'hey', 'yo', 'hola', 'namaste', 'good morning', 'good evening'],
    answer: () => ({
      tool: 'greet()',
      result: 'ok',
      segs: [T("Hey! I'm Adwaidh's portfolio agent. Ask me what he's built, his MCP work, his stack, relocation, or how to reach him.")],
    }),
  },
];

function route(q: string): Answer {
  const s = ` ${q.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ')} `;
  let best: Intent | null = null;
  let bestScore = 0;
  for (const it of intents) {
    let score = 0;
    for (const key of it.keys) {
      const [k, w] = typeof key === 'string' ? [key, key.length > 5 ? 2 : 1] : key;
      if (k.length <= 3 ? new RegExp(`\\b${k}\\b`).test(s) : s.includes(k)) score += w;
    }
    if (score > bestScore) { bestScore = score; best = it; }
  }
  if (best) return best.answer();
  return {
    tool: 'search_portfolio(query=…)',
    result: '0 matches',
    segs: [T("I only know what's on this portfolio, and I couldn't find that. Try: what he's built, MCP, tech stack, experience, projects, relocation or contact.")],
  };
}

export function initAgentChat(deps: {
  reduced: boolean;
  highlight: (sectionId: string) => void;
  goTo: (sectionId: string) => void;
}) {
  const fab = document.querySelector<HTMLButtonElement>('[data-agent-open]');
  const panel = document.querySelector<HTMLElement>('[data-agent]');
  const log = document.querySelector<HTMLElement>('[data-agent-log]');
  const form = document.querySelector<HTMLFormElement>('[data-agent-form]');
  const input = form?.querySelector('input');
  const close = document.querySelector<HTMLButtonElement>('[data-agent-close]');
  const sugs = document.querySelector<HTMLElement>('[data-agent-sugs]');
  if (!fab || !panel || !log || !form || !input || !close || !sugs) return;

  let busy = false;
  let greeted = false;

  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, deps.reduced ? 0 : ms));

  function msg(who: 'user' | 'agent') {
    const m = document.createElement('div');
    m.className = `msg msg--${who}`;
    const w = document.createElement('span');
    w.className = 'msg__who';
    w.textContent = who === 'user' ? 'you' : 'agent';
    m.appendChild(w);
    log!.appendChild(m);
    return m;
  }

  async function typeInto(el: HTMLElement, segs: Seg[]) {
    const caret = document.createElement('span');
    caret.className = 'typing-caret';
    for (const seg of segs) {
      const node: HTMLElement | Text = seg.href ? Object.assign(document.createElement('a'), { href: seg.href }) : document.createTextNode('');
      if (seg.href && /^https?:/.test(seg.href)) { (node as HTMLAnchorElement).target = '_blank'; (node as HTMLAnchorElement).rel = 'noopener'; }
      el.appendChild(node);
      el.appendChild(caret);
      if (deps.reduced) { node.textContent = seg.text; continue; }
      const chunk = seg.text.length > 200 ? 4 : 2;
      for (let i = 0; i < seg.text.length; i += chunk) {
        node.textContent = seg.text.slice(0, i + chunk);
        scrollLog();
        await sleep(12);
      }
    }
    caret.remove();
  }

  async function ask(q: string) {
    if (busy || !q.trim()) return;
    busy = true;
    const u = msg('user');
    const ut = document.createElement('div');
    ut.className = 'msg__text';
    ut.textContent = q.trim();
    u.appendChild(ut);

    const ans = route(q);
    const a = msg('agent');
    const tool = document.createElement('div');
    tool.className = 'msg__tool';
    tool.innerHTML = '▸ calling <span class="fn"></span> …';
    tool.querySelector('.fn')!.textContent = ans.tool;
    a.appendChild(tool);
    scrollLog();
    await sleep(520);
    const ok = document.createElement('span');
    ok.className = 'ok';
    ok.textContent = ` ✓ ${ans.result}`;
    tool.lastChild!.textContent = '';
    tool.appendChild(ok);

    const text = document.createElement('div');
    text.className = 'msg__text';
    a.appendChild(text);
    await typeInto(text, ans.segs);

    if (ans.section) {
      deps.highlight(ans.section);
      const jump = document.createElement('button');
      jump.type = 'button';
      jump.className = 'msg__jump';
      jump.textContent = `→ Show me ${ans.sectionLabel}`;
      const target = ans.section;
      jump.addEventListener('click', () => deps.goTo(target));
      a.appendChild(jump);
    }
    scrollLog();
    busy = false;
  }

  /* ---------- Teaser popup: invites visitors to try the agent ---------- */
  const hint = document.querySelector<HTMLElement>('[data-agent-hint]');
  const HINT_KEY = 'agentHintDismissed';
  const hintDismissed = (() => { try { return sessionStorage.getItem(HINT_KEY) === '1'; } catch { return false; } })();
  function showHint() {
    if (!hint || panel!.dataset.open === 'true') return;
    hint.dataset.open = 'true';
    fab!.classList.add('is-nudge');
    // show "typing…" dots first, then the message
    setTimeout(() => hint.classList.add('is-typed'), deps.reduced ? 0 : 1200);
    // don't sit on top of the content forever: tuck away after a while (the "1" badge stays)
    setTimeout(() => {
      if (hint.dataset.open === 'true') { hint.dataset.open = 'false'; fab!.classList.remove('is-nudge'); }
    }, 14000);
  }
  function hideHint() {
    if (!hint) return;
    hint.dataset.open = 'false';
    fab!.classList.remove('is-nudge');
    fab!.classList.add('is-seen');
    try { sessionStorage.setItem(HINT_KEY, '1'); } catch { /* private mode */ }
  }
  if (hint) {
    if (hintDismissed) fab.classList.add('is-seen');
    else setTimeout(showHint, 5200);
    hint.addEventListener('click', (e) => {
      const dismiss = (e.target as HTMLElement).closest('[data-agent-hint-close]');
      hideHint();
      if (!dismiss) open();
    });
  }

  function open() {
    hideHint();
    panel!.dataset.open = 'true';
    fab!.setAttribute('aria-expanded', 'true');
    setTimeout(() => input!.focus({ preventScroll: true }), 80);
    if (!greeted) {
      greeted = true;
      const a = msg('agent');
      const t = document.createElement('div');
      t.className = 'msg__text';
      a.appendChild(t);
      typeInto(t, [T(`Agent online. I answer from ${profile.firstName}'s portfolio only — pick a question below or type your own.`)]);
    }
  }
  function shut(returnFocus = true) {
    panel!.dataset.open = 'false';
    fab!.setAttribute('aria-expanded', 'false');
    if (returnFocus) fab!.focus({ preventScroll: true });
  }

  fab.addEventListener('click', open);
  close.addEventListener('click', () => shut());
  // clicking or tapping anywhere outside the chat closes it (focus stays where the visitor clicked)
  document.addEventListener('pointerdown', (e) => {
    if (panel.dataset.open !== 'true') return;
    if ((e.target as Element | null)?.closest?.('[data-agent], [data-agent-open], [data-agent-hint], [data-ask]')) return;
    shut(false);
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    ask(q);
  });
  sugs.addEventListener('click', (e) => {
    if (dragged) return; // the pointer was dragging the row, not picking a question
    const b = (e.target as HTMLElement).closest('button');
    if (b) ask(b.textContent ?? '');
  });

  /* ---------- Suggested questions: a scrollable strip (wheel, drag, arrows) ---------- */
  const sugWrap = sugs.closest<HTMLElement>('[data-sugwrap]');
  const syncEdges = () => {
    const max = sugs.scrollWidth - sugs.clientWidth;
    sugWrap?.classList.toggle('can-prev', sugs.scrollLeft > 4);
    sugWrap?.classList.toggle('can-next', sugs.scrollLeft < max - 4);
  };
  sugs.addEventListener('scroll', syncEdges, { passive: true });
  new ResizeObserver(syncEdges).observe(sugs);
  // a normal mouse wheel scrolls the strip sideways
  sugs.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = sugs.scrollWidth - sugs.clientWidth;
    if (max <= 0) return;
    e.preventDefault();
    sugs.scrollLeft += e.deltaY;
  }, { passive: false });
  // drag to scroll with a mouse (touch already scrolls natively)
  let dragX = 0, dragStart = 0, dragging = false, dragged = false;
  sugs.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; dragged = false; dragX = e.clientX; dragStart = sugs.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    if (!dragged && Math.abs(dx) > 5) { dragged = true; sugs.classList.add('is-dragging'); }
    if (dragged) sugs.scrollLeft = dragStart - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    sugs.classList.remove('is-dragging');
    setTimeout(() => { dragged = false; }, 0); // let the click after a drag be ignored first
  });
  sugWrap?.querySelectorAll<HTMLButtonElement>('[data-sug-step]').forEach((btn) => btn.addEventListener('click', () => {
    sugs.scrollBy({ left: Number(btn.dataset.sugStep) * sugs.clientWidth * 0.7, behavior: deps.reduced ? 'auto' : 'smooth' });
  }));

  /* Other parts of the page can open the chat with a question: dispatch 'agent:ask' with the text */
  document.addEventListener('agent:ask', (e) => {
    const q = (e as CustomEvent<string>).detail;
    const first = !greeted;
    open();
    if (q) setTimeout(() => ask(q), deps.reduced ? 0 : first ? 1500 : 250);
  });
}
