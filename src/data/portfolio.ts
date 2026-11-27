/* ==========================================================================
   PORTFOLIO CONTENT — edit this file to update the whole site.
   Nothing in here touches the design: add a project, a job or a skill and
   the page, the 3D scenes, the SEO tags and the "Ask my agent" chat all pick
   it up automatically.
   ========================================================================== */

/** AI roles you're open to. Shown in the contact section, the big banner, the AI agent's answers
 *  and the search-engine keywords — add or remove titles here. */
export const openRoles = [
  'AI Engineer', 'Agentic AI Developer', 'LLM Engineer', 'Generative AI Engineer', 'Applied AI Engineer',
  'AI Agent Developer', 'AI/ML Engineer', 'Python AI Developer', 'RAG Engineer', 'Conversational AI Developer',
  'AI Automation Engineer', 'AI Integration Engineer', 'AI Solutions Engineer', 'Prompt Engineer',
  'Python Full-Stack Developer',
];

/** Job preferences the AI agent shares when a visitor asks (they aren't shown on the page). */
export const workPrefs = {
  salary: '₹30,000 to ₹50,000 per month',
  hours: '9 AM to 6 PM shifts',
  balance: 'a good work-life balance',
  /** Your time zone, used when someone asks the agent for the time. */
  timeZone: 'Asia/Kolkata',
};

export const profile = {
  name: 'Adwaidh MP',
  firstName: 'Adwaidh',
  lastName: 'MP',
  title: 'Software Engineer | AI & Agentic Systems | Python Full-Stack',
  shortTitle: 'AI Engineer',
  /** Short "about me" on the back of the photo card and under the About portrait. */
  headline: 'AI Software Developer',
  aboutShort: 'I build agentic AI systems, MCP servers and LLM-powered products with Python.',
  /** Search terms people use for this kind of role (also added to the page's search keywords). */
  keywords: ['AI Software Developer', 'AI Engineer', 'Agentic AI Developer', 'LLM Engineer', 'Generative AI', 'Python Developer', 'MCP', 'RAG'],
  tagline: "I build AI agents that don't just talk. They get work done.",
  location: 'Kannur, Kerala, India',
  locality: 'Kannur',
  region: 'Kerala',
  country: 'IN',
  relocation: 'Open to relocation (including the GCC)',
  /** From the GCC resume; the agent shares these when asked (not shown on the page). */
  nationality: 'Indian',
  visa: 'needs an employment visa for roles abroad',
  notice: 'immediate',
  languages: ['English', 'Malayalam', 'Hindi'],
  availability: 'Open to AI and full-stack roles: AI Engineer, Agentic AI, LLM, Generative AI, Python Full-Stack and more · Full-time, remote or freelance · Open to relocation, including the GCC',
  /** Words cycled by the typing animation in the hero. */
  typing: ['AI Agents', 'MCP Servers', 'Agentic Chat', 'Python Backends', 'LLM-Powered Products'],
  /** Drop your resume at public/resume/Adwaidh-MP-Resume.pdf */
  resume: '/resume/Adwaidh-MP-Resume.pdf',
  /** Portrait shown on the "Adwaidh MP" card in the hero strip (a dark poster card with the photo
   *  filling it). Set to '' to go back to the "AM" monogram card. */
  photo: '/images/me.jpg' as string,
};

export const seo = {
  title: 'Adwaidh MP | AI Engineer, Agentic AI & Python',
  description:
    'Adwaidh MP, AI Engineer & Python developer in Kerala, India. Builds AI agents, MCP servers and RAG systems. Open to AI, agentic AI, LLM & GenAI roles.',
  keywords: [
    'AI Engineer', 'LLM Engineer', 'Agentic AI developer', 'AI agent developer', 'MCP server developer',
    'Python developer', 'Django developer', 'FastAPI developer', 'software developer for hire',
    'freelance AI developer', 'freelance Python developer', 'software engineer Kerala', 'AI engineer Kannur',
    'Claude API developer', 'RAG developer', 'LangGraph', 'full-stack Python developer',
  ],
  ogImage: '/og.png',
};

export const about = {
  summary:
    'AI-focused Python developer with 1.5+ years of experience building LLM-powered products. At Desklog (SaaS), I built agentic AI systems in production: an autonomous FastAPI coding agent on the Claude API, MCP servers that connect the product to Claude and ChatGPT, and an in-app AI agent that answers data questions and takes actions from chat. Strong Python backend skills (Django, DRF, FastAPI, Celery, Redis), React frontend, and hands-on RAG and LangGraph work. Seeking AI/LLM engineering and full-stack roles.',
  highlights: [
    { value: 1.5, decimals: 1, suffix: '+', label: 'Years hands-on experience' },
    { value: 4, decimals: 0, suffix: '', label: 'Production AI systems built at Desklog' },
    { value: 2, decimals: 0, suffix: '', label: 'MCP servers built' },
    { value: 2, decimals: 0, suffix: '', label: 'Claude Code & Codex plugins built' },
  ],
};

export type SkillCategory = { id: string; name: string; skills: string[]; featured?: boolean };

export const skills: SkillCategory[] = [
  { id: 'ai', name: 'AI & Agentic AI', featured: true, skills: ['AI Agents', 'MCP Servers', 'Claude API', 'OpenAI API', 'LangChain', 'LangGraph', 'RAG', 'ChromaDB', 'Claude Code', 'Codex'] },
  { id: 'lang', name: 'Languages', skills: ['Python', 'JavaScript', 'SQL', 'PHP'] },
  { id: 'backend', name: 'Backend', skills: ['Django', 'DRF', 'FastAPI', 'Laravel', 'Node.js', 'REST APIs', 'Microservices', 'JWT', 'OAuth 2.0', 'RBAC'] },
  { id: 'async', name: 'Async Processing', skills: ['Celery', 'Celery Beat', 'RabbitMQ', 'Redis'] },
  { id: 'realtime', name: 'Real-Time Systems', skills: ['Django Channels', 'WebSockets', 'WebRTC'] },
  { id: 'frontend', name: 'Frontend & Databases', skills: ['React.js', 'Redux Toolkit', 'Tailwind CSS', 'Blade', 'PostgreSQL', 'MySQL', 'SQLite'] },
  { id: 'devops', name: 'DevOps & Cloud', skills: ['Docker', 'AWS (EC2, S3, RDS)', 'Cloudflare', 'Linux', 'Nginx', 'Gunicorn', 'PM2', 'CI/CD'] },
  { id: 'tools', name: 'Tools', skills: ['Git', 'GitHub', 'GitLab', 'Postman', 'Razorpay'] },
  { id: 'design', name: 'System Design', skills: ['Scalability', 'Load Balancing', 'Caching', 'Rate Limiting', 'CDN', 'Message Queues'] },
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
    start: 'Jan 2026',
    end: 'Present',
    current: true,
    agentFlow: true,
    points: [
      'Developed an autonomous AI coding agent using FastAPI and Claude API, integrated with Desklog for automated task execution and code generation.',
      'Built MCP servers for Desklog and its CRM, enabling Claude and ChatGPT to interact with application data and perform actions.',
      'Developed an in-app AI assistant with MCP tool calling to answer queries and execute actions using live product data.',
      "Created Claude Code and OpenAI Codex plugins to track and report developers' AI usage.",
      "Developed backend features, REST APIs, and optimized database queries for Desklog's multi-tenant SaaS platform.",
      'Built application interfaces using Laravel Blade and integrated Slack, Google Chat, and Google Calendar.',
      'Managed deployments and infrastructure across AWS, Cloudflare, and Linux servers.',
    ],
    tech: ['Python', 'FastAPI', 'Claude API', 'OpenAI API', 'MCP', 'PHP', 'Laravel', 'Node.js', 'MySQL', 'Redis', 'AWS', 'Cloudflare', 'Docker'],
  },
  {
    id: 'bridgeon',
    title: 'Full-Stack Python Developer Intern',
    company: 'Bridgeon Solutions',
    location: 'Malappuram',
    start: 'May 2025',
    end: 'Dec 2025',
    points: [
      'Built REST APIs and backend services with Django, DRF, and FastAPI, including auth and role-based access.',
      'Used Celery and RabbitMQ for emails, notifications, scheduled jobs, and AI tasks, with Redis caching.',
      'Built responsive frontends with React.js, Redux Toolkit, and Tailwind CSS, connected to backend APIs.',
      'Containerized services with Docker and deployed on AWS (EC2, RDS, S3) with Nginx, Gunicorn, and CI/CD.',
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
    summary: 'In progress: a new agentic system built in Python. Check back soon.',
    points: [],
    tags: ['Python', 'Agentic AI'],
    links: [],
    accent: 'dark',
    comingSoon: true,
  },
];

export const education = [
  { kind: 'Degree', title: 'BCA, Bachelor of Computer Applications', org: 'Kannur University', period: '2019 to 2022' },
  { kind: 'Certification', title: 'Full-Stack Python Developer', org: 'Bridgeon Solutions', period: '2025' },
  { kind: 'Certification', title: 'Data Science', org: 'ExcelR', period: '2023 to 2024' },
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
  'What roles is he open to?',
  'Is he open to relocation?',
  "What's his education?",
  'Can I download his resume?',
  'How can I contact him?',
];

/** Words that scroll in the red marquee strips. */
/** The big banner between Skills and Experience. */
export const availabilityBanner = ['Open to AI roles', 'AI Engineer', 'Agentic AI Developer', 'LLM Engineer', 'Generative AI Engineer', 'Applied AI Engineer', 'Python Full-Stack', 'Full-time', 'Freelance', 'Remote', 'Open to GCC relocation'];

export const marquee = ['AI Agents', 'MCP Servers', 'Agentic Chat', 'Claude API', 'LangGraph', 'RAG', 'Python Backends', 'FastAPI', 'Django'];
