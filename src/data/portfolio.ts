/* ==========================================================================
   PORTFOLIO CONTENT — edit this file to update the whole site.
   Nothing in here touches the design: add a project, a job or a skill and
   the page, the 3D scenes, the SEO tags and the "Ask my agent" chat all pick
   it up automatically.
   ========================================================================== */

export const profile = {
  name: 'Adwaidh MP',
  firstName: 'Adwaidh',
  lastName: 'MP',
  title: 'Software Engineer | AI & Agentic Systems | Python',
  shortTitle: 'AI Engineer',
  tagline: "I build AI agents that don't just talk — they get work done.",
  location: 'Kannur, Kerala, India',
  locality: 'Kannur',
  region: 'Kerala',
  country: 'IN',
  relocation: 'Open to relocation (including the GCC)',
  availability: 'Open to AI / LLM engineering roles · Open to relocation, including the GCC · Available for freelance AI & Python projects',
  /** Words cycled by the typing animation in the hero. */
  typing: ['AI Agents', 'MCP Servers', 'Agentic Chat', 'Python Backends', 'LLM-Powered Products'],
  /** Drop your resume at public/resume/Adwaidh-MP-Resume.pdf */
  resume: '/resume/Adwaidh-MP-Resume.pdf',
  /** Optional: put a square-ish photo at public/images/me.jpg and set this to '/images/me.jpg'.
   *  It appears (in black & white) on the centre card of the hero wheel. */
  photo: '' as string,
};

export const seo = {
  title: 'Adwaidh MP — AI Engineer | Agentic AI & Python',
  description:
    'Adwaidh MP — AI Engineer & Python developer in Kerala, India. Builds AI agents, MCP servers and RAG systems. Open to AI/LLM roles, freelance & GCC relocation.',
  keywords: [
    'AI Engineer', 'LLM Engineer', 'Agentic AI developer', 'AI agent developer', 'MCP server developer',
    'Python developer', 'Django developer', 'FastAPI developer', 'software developer for hire',
    'freelance AI developer', 'freelance Python developer', 'software engineer Kerala', 'AI engineer Kannur',
    'Claude API developer', 'RAG developer', 'LangGraph',
  ],
  ogImage: '/og.png',
};

export const about = {
  summary:
    'AI-focused Python developer with 1.5+ years of experience building LLM-powered products. At Desklog (SaaS), I build agentic AI systems in production: an autonomous coding agent on the Claude API, MCP servers that connect the product to Claude and ChatGPT, and an in-app AI agent that answers data questions and takes actions from chat. Strong Python backend skills (Django, DRF, FastAPI, Celery, Redis), DevOps and cloud deployment experience (Docker, AWS EC2/RDS/S3, Cloudflare, Contabo, Nginx reverse proxy, PM2), and hands-on RAG and LangGraph work. Seeking AI/LLM engineering roles.',
  highlights: [
    { value: 1.5, decimals: 1, suffix: '+', label: 'Years hands-on experience' },
    { value: 4, decimals: 0, suffix: '', label: 'Production AI systems built at Desklog' },
    { value: 2, decimals: 0, suffix: '', label: 'MCP servers built' },
    { value: 1, decimals: 0, suffix: '', label: 'Claude Code & Codex plugin built' },
  ],
};

export type SkillCategory = { id: string; name: string; skills: string[]; featured?: boolean };

export const skills: SkillCategory[] = [
  { id: 'ai', name: 'AI & Agentic AI', featured: true, skills: ['Claude API', 'MCP Servers', 'AI Agents', 'Claude Code & Codex Plugins', 'LangChain', 'LangGraph', 'RAG', 'ChromaDB', 'OpenAI API'] },
  { id: 'lang', name: 'Languages', skills: ['Python', 'JavaScript', 'SQL'] },
  { id: 'backend', name: 'Backend', skills: ['Django', 'DRF', 'FastAPI', 'REST APIs', 'JWT', 'OAuth', 'Role-Based Access', 'Microservices'] },
  { id: 'async', name: 'Async & Caching', skills: ['Celery', 'Celery Beat', 'RabbitMQ', 'Redis'] },
  { id: 'realtime', name: 'Realtime', skills: ['Django Channels', 'WebSockets', 'WebRTC'] },
  { id: 'frontend', name: 'Frontend & Databases', skills: ['React.js', 'Redux Toolkit', 'Tailwind', 'PostgreSQL', 'MySQL', 'SQLite'] },
  { id: 'devops', name: 'DevOps & Cloud', skills: ['Docker', 'AWS (EC2, S3, RDS)', 'Cloudflare', 'Contabo', 'Linux', 'Nginx (Reverse Proxy)', 'Gunicorn', 'PM2', 'Cron Jobs', 'CI/CD'] },
  { id: 'tools', name: 'Tools', skills: ['Git', 'GitHub', 'Postman', 'Razorpay'] },
  { id: 'also', name: 'Also', skills: ['PHP (Laravel, Blade)', 'Node.js'] },
];

export type Role = {
  id: string;
  title: string;
  company: string;
  companyNote?: string;
  location?: string;
  start: string;
  end: string;
  current?: boolean;
  points: string[];
  tech?: string[];
  /** Shows the animated Task → Agent → MCP → Data → Done diagram. */
  agentFlow?: boolean;
};

export const experience: Role[] = [
  {
    id: 'desklog',
    title: 'Software Engineer',
    company: 'Infinite Open Source Solutions',
    companyNote: 'Desklog',
    start: 'Feb 2026',
    end: 'Present',
    current: true,
    agentFlow: true,
    points: [
      'Built an autonomous AI coding agent on the Claude API that picks up assigned Desklog tasks, writes the code, and completes them end to end.',
      'Built MCP servers for Desklog and Desklog CRM, exposing tools so Claude and ChatGPT (including their web apps) can read and act on product data.',
      'Developed an in-app agentic AI chat with MCP tool calling that answers questions from live product data (e.g. who is absent today, who worked the most) and performs actions (e.g. enabling features, running tasks) from natural-language commands.',
      "Built a plugin for Claude Code and OpenAI Codex that tracks developers' AI usage and reports it to Desklog.",
      'Contribute to the backend of Desklog, a multi-tenant time-tracking SaaS platform used worldwide, working primarily with Laravel and PHP across its distributed, load-balanced architecture.',
      'Develop and improve backend features and REST APIs, with a focus on database optimization, indexing, and caching to support concurrent tenant workloads.',
      'Built external integrations with Slack, Google Calendar, and Google Chat.',
      'Also delivered core product features with Blade frontend UI, internal tools (Desklog CRM, Super Admin panel), and deployments on AWS, Cloudflare, and Contabo (Linux, PM2, cron jobs).',
    ],
    tech: ['Claude API', 'OpenAI API', 'MCP', 'PHP (Laravel, Blade)', 'Node.js', 'MySQL', 'AWS', 'Cloudflare', 'Linux'],
  },
  {
    id: 'bridgeon',
    title: 'Full-Stack Python Developer Intern',
    company: 'Bridgeon Solutions',
    location: 'Malappuram',
    start: 'Jun 2025',
    end: 'Feb 2026',
    points: [
      'Built REST APIs and backend services with Django, DRF, and FastAPI, including auth and role-based access.',
      'Used Celery and RabbitMQ for emails, notifications, scheduled jobs, and AI tasks, and Redis caching to speed up APIs and reduce database load.',
      'Built responsive frontends with React.js, Redux Toolkit, and Tailwind CSS, connected to backend APIs.',
      'Containerized services with Docker and deployed on AWS (EC2, RDS, S3) with Nginx, Gunicorn, and CI/CD, working in Agile sprints with code reviews.',
    ],
    tech: ['Django', 'DRF', 'FastAPI', 'Celery', 'RabbitMQ', 'Redis', 'React.js', 'Docker', 'AWS'],
  },
];

export const agentFlowSteps = ['Task', 'AI Agent', 'MCP Tools', 'Product Data / Actions', 'Completed'];

export type Project = {
  id: string;
  title: string;
  summary: string;
  points: string[];
  tags: string[];
  links: { label: string; href: string }[];
  /** Card style on the front face: 'gold' | 'dark' | 'light' */
  accent?: 'gold' | 'dark' | 'light';
  comingSoon?: boolean;
};

export const projects: Project[] = [
  {
    id: 'fitai',
    title: 'AI-Powered Fitness & Nutrition Platform',
    summary: 'Role-based microservices platform with AI-generated plans, real-time trainer calls and a hybrid, hallucination-resistant knowledge assistant.',
    points: [
      'Role-based microservices platform (Admin, Trainer, User) with Django, DRF, JWT, Google OAuth, and OTP.',
      'AI-generated weekly diet and workout plans; Razorpay subscriptions renewed via Celery Beat, SQS, and Lambda.',
      'Real-time trainer booking, chat, and video calls with Django Channels, WebSockets, and WebRTC.',
      'Hybrid AI Knowledge Assistant: FastAPI service with SVC intent and safety classifiers, RAG (LangChain, ChromaDB), and LangGraph; the LLM is called only after ML and retrieval checks, to prevent hallucinations.',
    ],
    tags: ['Python', 'Django', 'FastAPI', 'LangGraph', 'RAG', 'WebRTC', 'Celery'],
    links: [
      { label: 'Frontend', href: 'https://github.com/adwaidhmp/FitAi-Frontend-.git' },
      { label: 'Backend', href: 'https://github.com/adwaidhmp/FitAi-Backend-.git' },
    ],
    accent: 'gold',
  },
  {
    id: 'next',
    title: 'New Python Agentic AI project',
    summary: 'In progress — a new agentic system built in Python. Check back soon.',
    points: [],
    tags: ['Python', 'Agentic AI'],
    links: [],
    accent: 'dark',
    comingSoon: true,
  },
];

export const education = [
  { kind: 'Degree', title: 'BCA — Bachelor of Computer Applications', org: 'Kannur University', period: '2019 – 2022' },
  { kind: 'Certification', title: 'Full-Stack Python Developer', org: 'Bridgeon Solutions', period: '2025' },
  { kind: 'Certification', title: 'Data Science', org: 'ExcelR', period: '2023 – 2024' },
];

export const contact = {
  heading: "Let's build intelligent systems together.",
  email: 'adwaidh7727@gmail.com',
  phone: '+91 9656367727',
  phoneHref: 'tel:+919656367727',
  github: 'https://github.com/adwaidhmp',
  linkedin: 'https://www.linkedin.com/in/adwaidh-mp-/',
  /** Optional: a form endpoint (e.g. https://formspree.io/f/xxxx). When empty, the form opens the
   *  visitor's email app with the message filled in, so it always works on a static site. */
  formEndpoint: '' as string,
};

/** `short` is used in the mobile bottom bar where space is tight. */
export const nav: { id: string; label: string; short?: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience', short: 'Work' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];

/** Suggested questions in the "Ask my AI agent" chat. Answers are built from the data above. */
export const agentSuggestions = [
  'What AI systems has Adwaidh built?',
  'What is his experience with MCP?',
  "What's his tech stack?",
  'What backend work has he done?',
  'What DevOps experience does he have?',
  'Which integrations has he built?',
  'How does he use RAG & LangGraph?',
  'Show me his projects',
  'Where has he worked?',
  'Is he available for freelance?',
  'Is he open to relocation?',
  "What's his education?",
  'Can I download his resume?',
  'How can I contact him?',
];

/** Words that scroll in the red marquee strips. */
export const marquee = ['AI Agents', 'MCP Servers', 'Agentic Chat', 'Claude API', 'LangGraph', 'RAG', 'Python Backends', 'FastAPI', 'Django'];
