/* "Ask my AI agent" — a terminal-style chat that answers only from the
   portfolio data, using keyword matching. No API keys, so it never breaks. */
import { profile, about, skills, experience, projects, education, contact, openRoles, workPrefs } from '../data/portfolio';
import { openCompose } from './compose';

type Seg = { text: string; href?: string };
type Answer = { tool: string; result: string; segs: Seg[]; section?: string; sectionLabel?: string; id?: string };
type Key = string | [string, number];
/** `re` matches whole phrasings (greetings, small talk); a match adds `reScore` (default 6). */
type Intent = { id: string; keys: Key[]; re?: RegExp; reScore?: number; answer: () => Answer };

const T = (text: string, href?: string): Seg => ({ text, href });
const current = experience.find((r) => r.current) ?? experience[0];
const cat = (id: string) => skills.find((c) => c.id === id);

/* small-talk helpers */
const partOfDay = () => { const h = new Date().getHours(); return h < 5 ? 'Hey' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
function timeAnswer(): Answer {
  const now = new Date();
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const t = (timeZone?: string) => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...(timeZone ? { timeZone } : {}) });
  const d = (timeZone?: string) => now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', ...(timeZone ? { timeZone } : {}) });
  // same zone (also catches aliases like Asia/Calcutta = Asia/Kolkata): just say it once
  const same = here === workPrefs.timeZone || (t() === t(workPrefs.timeZone) && d() === d(workPrefs.timeZone));
  return {
    tool: `get_time(tz="${here}")`,
    result: 'ok',
    segs: [T(same
      ? `It's ${t()} on ${d()} (IST), the same time zone as ${profile.firstName} in ${profile.locality}, India.`
      : `It's ${t()} on ${d()} where you are.\nIn ${profile.locality}, India (${profile.firstName}'s time zone, IST) it's ${t(workPrefs.timeZone)} on ${d(workPrefs.timeZone)}.`)],
  };
}
const jokes = [
  'Why did the AI agent cross the road? It was the next step in its plan. 🙂',
  'An LLM walks into a bar. The bartender asks, "What will it be?" It says, "Let me predict the next token…" 🙂',
  "I'd tell you a joke about RAG, but I'd have to retrieve it first. 🙂",
];
let jokeAt = 0;

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
        '③ An in-app agentic chat with MCP tool calling. It answers live data questions ("who is absent today?") and runs actions from plain language.\n' +
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
        'MCP is core to his work. He built 2 MCP servers, for Desklog and Desklog CRM, exposing tools so Claude and ChatGPT (including their web apps) can read and act on product data. ' +
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
        `At ${current.companyNote ?? current.company} he works on the backend of a multi-tenant time-tracking SaaS used worldwide, mainly Laravel and PHP on a distributed, load-balanced architecture. ` +
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
        'He ships and runs his own services: Docker containers deployed on AWS (EC2, RDS, S3), Cloudflare and Contabo: Linux servers with Nginx as a reverse proxy, Gunicorn and PM2 for the app processes, cron jobs for scheduled work, and CI/CD pipelines.\n' +
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
        T('\nOr use the form in the contact section. He usually replies within a day.'),
      ],
    }),
  },
  {
    id: 'hire',
    keys: ['hire', 'hiring', 'freelance', 'available', 'availability', 'open to', 'job', 'role', 'position', 'vacanc', 'notice', 'join', 'opportunit', 'recruit', 'full time', 'genai', 'generative'],
    answer: () => ({
      tool: 'get_availability()',
      result: 'available',
      section: 'contact', sectionLabel: 'Contact',
      segs: [
        T(`He's open to all AI roles: ${openRoles.join(', ')}.\nFull-time, remote or freelance, and open to relocation, including the GCC.\nBest way to start: `),
        T(contact.email, `mailto:${contact.email}`),
      ],
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
        experience.map((r) => `• ${r.title} at ${r.company}${r.companyNote ? ` (${r.companyNote})` : ''}, ${r.start} to ${r.end}`).join('\n'),
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
        T('\nNext up: a new Python agentic AI project, in progress.'),
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
        'The LLM is only called after the ML and retrieval checks pass, a deliberate design to prevent hallucinations.',
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
      segs: [T(education.map((e) => `• ${e.title}, ${e.org} (${e.period})`).join('\n'))],
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
    id: 'salary',
    keys: [['salary', 4], ['ctc', 4], ['compensation', 4], ['lpa', 4], ['package', 3], ['expectation', 2], ['expected', 2], 'pay', 'wage', 'stipend', 'how much', 'earn', 'hourly rate', 'remuneration', 'budget'],
    answer: () => ({
      tool: 'get_preferences(field="salary")',
      result: 'ok',
      section: 'contact', sectionLabel: 'Contact',
      segs: [
        T(`${profile.firstName}'s expected salary is around ${workPrefs.salary}. ${workPrefs.hours} work well for him, and he values ${workPrefs.balance}.\nWant to discuss a role? Reach him at `),
        T(contact.email, `mailto:${contact.email}`),
      ],
    }),
  },
  {
    id: 'hours',
    keys: [['working hours', 5], ['work hours', 5], ['working time', 5], ['work timing', 5], ['office hours', 5], ['timings', 3], ['shift', 4], ['9 to 6', 5], ['9 6', 3], ['nine to six', 5], ['work life', 5], ['balance', 3], ['schedule', 3], ['hours', 2], 'night', 'weekend', 'overtime', 'flexible'],
    answer: () => ({
      tool: 'get_preferences(field="hours")',
      result: 'ok',
      segs: [T(`${workPrefs.hours} are fine for him, and he values ${workPrefs.balance}. He's open to full-time, remote or freelance work, and to relocation, including the GCC.`)],
    }),
  },
  {
    id: 'time',
    keys: [],
    re: /\b(what s|what is|whats|tell me) the (time|date)\b|\bwhat time is it\b|\btime (now|is it|right now)\b|\bcurrent (time|date)\b|\bwhat day is (it|today)\b|\btoday s date\b|\blocal time\b|\btime in (india|kerala|kannur)\b/,
    answer: timeAnswer,
  },
  /* ---------- small talk ---------- */
  {
    id: 'hello',
    keys: [],
    re: /^\s*(hi+|hy+|hey+|heya|hai|hello+|helo|hellow|hola|namaste|namaskaram|yo|hiya|howdy|greetings|good (morning|afternoon|evening|day))( (there|bro|buddy|agent|adwaidh|team|all|everyone|sir|mam|madam))?\s*[.!]*\s*$/,
    answer: () => ({
      tool: 'greet()',
      result: 'ok',
      segs: [T(`${partOfDay()}! 👋 I'm ${profile.firstName}'s portfolio agent. Ask me what he's built, his skills and experience, the roles he's open to, or how to reach him.`)],
    }),
  },
  {
    id: 'how-are-you',
    keys: [],
    re: /\b(how are (you|u)|how r (you|u)|how s it going|how is it going|how are things|how do you do|what s up|whats up|wassup|sup)\b/,
    reScore: 5,
    answer: () => ({
      tool: 'status()',
      result: 'all systems green',
      segs: [T(`Doing great, thanks for asking! 😊 How can I help? Want to hear what ${profile.firstName} has built?`)],
    }),
  },
  {
    id: 'identity',
    keys: [],
    re: /\b(who are (you|u)|what are (you|u)|are (you|u) (a |an )?(bot|ai|human|real|robot|person|chatgpt|claude|gpt)|your name|who (made|built|created) (you|u)|what is this chat)\b/,
    answer: () => ({
      tool: 'whoami()',
      result: 'ok',
      segs: [T(`I'm ${profile.firstName}'s portfolio agent, a small assistant he built into this site. I answer only from his portfolio (no guessing), point you to the right section, and can help you send him a message.`)],
    }),
  },
  {
    id: 'help',
    keys: [],
    re: /(^\s*help\s*[.!]*\s*$)|\b(what can (you|u|i) (do|ask)|help me|what do you know|what can you tell( me)?|how does this work|how do i use (this|you))\b/,
    reScore: 5,
    answer: () => ({
      tool: 'list_tools()',
      result: 'ok',
      segs: [T(`I can tell you about ${profile.firstName}'s AI work, MCP servers, tech stack, backend and DevOps experience, projects, education, the roles he's open to, salary expectations, working hours, the time in India, or how to contact him. Just ask!`)],
    }),
  },
  {
    id: 'thanks',
    keys: [],
    re: /^\s*(ok(ay)?|k|kk|cool|nice|great|awesome|perfect|super|wow|got it|good|alright|fine|thanks?|thank (you|u)|thx|ty|tysm|cheers)( (thanks?|thank (you|u)|a lot|so much|man|bro|buddy|dude|mate|again))*\s*[.!]*\s*$/,
    answer: () => ({
      tool: 'ack()',
      result: 'ok',
      segs: [T("You're welcome! 😊 Anything else? Ask about his projects, skills, salary expectations or how to reach him.")],
    }),
  },
  {
    id: 'bye',
    keys: [],
    re: /^\s*(bye+|goodbye|good bye|see (you|ya|u)|cya|later|take care|good night|gn)\b/,
    answer: () => ({
      tool: 'goodbye()',
      result: 'ok',
      section: 'contact', sectionLabel: 'Contact',
      segs: [T(`Thanks for stopping by! 👋 If you'd like to work with ${profile.firstName}, the contact section is one click away.`)],
    }),
  },
  {
    id: 'joke',
    keys: [],
    re: /\b(joke|jokes|funny|make me laugh|bored)\b/,
    reScore: 5,
    answer: () => ({
      tool: 'tell_joke()',
      result: 'ok',
      segs: [T(`${jokes[jokeAt++ % jokes.length]}\nWant to see the real agents ${profile.firstName} has built? Just ask.`)],
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
    if (it.re?.test(s)) score += it.reScore ?? 6;
    if (score > bestScore) { bestScore = score; best = it; }
  }
  if (best) return { ...best.answer(), id: best.id };
  return {
    tool: 'search_portfolio(query=…)',
    result: '0 matches',
    segs: [T(`Hmm, I'm not sure about that one. I only know what's on ${profile.firstName}'s portfolio. Try asking about his AI work, skills, experience, the roles he's open to, salary expectations, working hours or how to contact him.`)],
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
    asked.push({ q: q.trim(), topic: !!ans.id && !SMALL_TALK.has(ans.id) });
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
    // every 2 messages, offer a ready-made message to Adwaidh (until the visitor has sent one)
    if (!draftSent && asked.length % DRAFT_EVERY === 0) setTimeout(openDraft, deps.reduced ? 0 : 700);
  }

  /* ---------- "Message Adwaidh?" card ---------- */
  const DRAFT_EVERY = 2;
  // every message counts towards the card; only real questions (not "hi", "thanks"…) go into the draft
  const SMALL_TALK = new Set(['hello', 'how-are-you', 'identity', 'help', 'thanks', 'bye', 'joke', 'time']);
  const asked: { q: string; topic: boolean }[] = [];
  let draftSent = false;
  const draft = panel.querySelector<HTMLFormElement>('[data-agent-draft]');
  const dStatus = draft?.querySelector<HTMLElement>('[data-draft-status]');
  const field = (n: string) => draft?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${n}"]`) ?? null;
  const edited = new Set<string>(); // fields the visitor typed in: never overwrite those
  draft?.addEventListener('input', (e) => {
    const n = (e.target as HTMLInputElement).name;
    if (n) edited.add(n);
    (e.target as HTMLElement).removeAttribute('aria-invalid');
    if (dStatus) { dStatus.textContent = ''; dStatus.className = 'agent__draft-status'; }
  });
  const isDraftOpen = () => draft?.dataset.open === 'true';

  function draftBody() {
    const qs = [...new Set(asked.filter((a) => a.topic).map((a) => a.q))].slice(-6).map((q) => `• ${q}`).join('\n');
    const intro = qs ? `I was chatting with your portfolio agent and asked about:\n${qs}` : 'I was chatting with your portfolio agent.';
    return `Hi ${profile.firstName},\n\n${intro}\n\nI'd like to talk with you about an opportunity. Could we set up a quick call?\n\nThanks,`;
  }
  function openDraft() {
    if (!draft || draftSent || panel!.dataset.open !== 'true') return;
    const subject = field('subject'), message = field('message');
    if (subject && !edited.has('subject')) subject.value = `Opportunity for ${profile.firstName} (via your portfolio agent)`;
    if (message && !edited.has('message')) message.value = draftBody();
    if (dStatus) { dStatus.textContent = ''; dStatus.className = 'agent__draft-status'; }
    draft.inert = false;
    draft.dataset.open = 'true';
    panel!.classList.add('has-draft');
    draft.scrollTop = 0;
  }
  function closeDraft() {
    if (!draft) return;
    draft.dataset.open = 'false';
    draft.inert = true;
    panel!.classList.remove('has-draft');
  }
  function agentSays(text: string) {
    const a = msg('agent');
    const t = document.createElement('div');
    t.className = 'msg__text';
    a.appendChild(t);
    typeInto(t, [T(text)]);
    scrollLog();
  }

  draft?.querySelector('[data-draft-ignore]')?.addEventListener('click', () => {
    closeDraft();
    input!.focus({ preventScroll: true });
  });
  draft?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = field('name')?.value.trim() ?? '';
    const emailEl = field('email') as HTMLInputElement | null;
    const email = emailEl?.value.trim() ?? '';
    const subject = field('subject')?.value.trim() ?? '';
    const message = field('message')?.value.trim() ?? '';
    const say = (t: string, kind = '') => { if (dStatus) { dStatus.textContent = t; dStatus.className = `agent__draft-status ${kind}`; } };
    if (!email || !emailEl?.checkValidity()) {
      emailEl?.setAttribute('aria-invalid', 'true');
      emailEl?.focus();
      say(`Add your email so ${profile.firstName} can reply.`, 'is-err');
      return;
    }
    if (!subject || !message) { say('Please add a subject and a message.', 'is-err'); return; }
    const sign = `\n\nFrom: ${name ? `${name} (${email})` : email}`;
    const endpoint = draft.dataset.endpoint;
    const sendBtn = draft.querySelector<HTMLButtonElement>('.agent__draft-send');
    if (endpoint) {
      // a form service (e.g. Formspree) delivers it straight to Adwaidh's inbox
      say('Sending…');
      if (sendBtn) sendBtn.disabled = true;
      try {
        const body = new FormData();
        body.append('name', name || email);
        body.append('email', email);
        body.append('_replyto', email);
        body.append('_subject', subject);
        body.append('subject', subject);
        body.append('message', message + sign);
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body });
        if (!res.ok) throw new Error(String(res.status));
        draftSent = true;
        say('Sent ✓', 'is-ok');
        setTimeout(closeDraft, deps.reduced ? 0 : 900);
        agentSays(`Done! Your message is on its way to ${profile.firstName}. He usually replies within a day.`);
      } catch {
        say(`Couldn't send right now. Please email ${draft.dataset.email} directly.`, 'is-err');
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    } else {
      // no form service set up: let the visitor pick Gmail / Outlook / their email app, all prefilled
      say('Ready. Choose how to send it:', 'is-ok');
      openCompose(sendBtn ?? draft, { to: draft.dataset.email ?? '', subject, body: message + sign }, {
        copy: 'message',
        onPick: (how) => {
          draftSent = true;
          closeDraft();
          agentSays(how === 'copy'
            ? `Copied! Paste it into an email to ${draft.dataset.email} and it's on its way.`
            : `Opened ${how === 'gmail' ? 'Gmail' : how === 'outlook' ? 'Outlook' : 'your email app'} with your message ready. Just hit send.`);
        },
      });
    }
  });

  /* ---------- Teaser popup: invites visitors to try the agent ---------- */
  const hint = document.querySelector<HTMLElement>('[data-agent-hint]');
  // The small "Ask me anything" bubble: pops up for 2s a little after load, then again every 3 minutes
  // (skipped while the chat is open or the tab is in the background). Tapping it opens the chat.
  const HINT_FIRST_MS = 5200, HINT_SHOW_MS = 2000, HINT_EVERY_MS = 3 * 60 * 1000;
  const SEEN_KEY = 'agentHintDismissed'; // the "1" badge on the button goes once the chat has been opened
  let hintT = 0;
  function flashHint() {
    if (!hint || panel!.dataset.open === 'true' || document.hidden) return;
    hint.dataset.open = 'true';
    fab!.classList.add('is-nudge');
    clearTimeout(hintT);
    hintT = window.setTimeout(() => { hint.dataset.open = 'false'; fab!.classList.remove('is-nudge'); }, HINT_SHOW_MS);
  }
  function hideHint() {
    if (!hint) return;
    clearTimeout(hintT);
    hint.dataset.open = 'false';
    fab!.classList.remove('is-nudge');
    fab!.classList.add('is-seen');
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
  }
  try { if (sessionStorage.getItem(SEEN_KEY) === '1') fab.classList.add('is-seen'); } catch { /* private mode */ }
  if (hint) {
    setTimeout(() => { flashHint(); setInterval(flashHint, HINT_EVERY_MS); }, HINT_FIRST_MS);
    hint.addEventListener('click', open);
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
      typeInto(t, [T(`Agent online. I answer from ${profile.firstName}'s portfolio only. Pick a question below or type your own.`)]);
    }
  }
  function shut(returnFocus = true) {
    closeDraft();
    panel!.dataset.open = 'false';
    fab!.setAttribute('aria-expanded', 'false');
    fitToKeyboard();
    if (returnFocus) fab!.focus({ preventScroll: true });
  }

  // Phones: the on-screen keyboard covers the bottom of the screen without moving the page, so this
  // fixed-to-the-bottom chat (and its typing field) would end up behind it. While the keyboard is up,
  // fit the chat into the part of the screen that is still visible, typing field just above the keyboard.
  const vv = window.visualViewport;
  let keyboardUp = false;
  function fitToKeyboard() {
    if (!vv) return;
    const up = panel!.dataset.open === 'true' && document.documentElement.clientHeight - vv.height > 120;
    if (!up) {
      if (keyboardUp) { panel!.style.removeProperty('top'); panel!.style.removeProperty('bottom'); panel!.style.removeProperty('height'); }
      keyboardUp = false;
      return;
    }
    const gap = 8;
    const h = Math.min(600, vv.height - gap * 2);
    panel!.style.height = `${h}px`;
    panel!.style.top = `${vv.offsetTop + vv.height - h - gap}px`;
    panel!.style.bottom = 'auto';
    if (!keyboardUp) log!.scrollTop = log!.scrollHeight; // keyboard just opened: keep the latest message in view
    keyboardUp = true;
  }
  vv?.addEventListener('resize', fitToKeyboard);
  vv?.addEventListener('scroll', fitToKeyboard);

  fab.addEventListener('click', open);
  close.addEventListener('click', () => shut());
  // clicking or tapping anywhere outside the chat closes it (focus stays where the visitor clicked)
  document.addEventListener('pointerdown', (e) => {
    if (panel.dataset.open !== 'true') return;
    if ((e.target as Element | null)?.closest?.('[data-agent], [data-agent-open], [data-agent-hint], [data-ask], .compose')) return;
    shut(false);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isDraftOpen()) closeDraft(); // first Escape closes the message card, the next one the chat
    else shut();
  });
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
