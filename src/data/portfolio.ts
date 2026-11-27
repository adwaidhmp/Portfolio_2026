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
  /** Date of birth (YYYY-MM-DD); the agent works out the age from it. */
  dob: '2001-12-07',
  passport: 'a valid Indian passport',
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

/* SEO notes:
   - Google ranks on the words people can SEE on the page (title, headings, services, FAQ), not on the
     `keywords` list below (Google ignores that tag; Bing reads it lightly). Keep the keywords honest and
     short: a long or misspelled list is treated as keyword stuffing and can push the site DOWN.
   - Casual / "broken English" searches ("need cheap website developer kerala") are matched by Google to
     pages that answer them, which is what the Services and FAQ sections below are for. */
export const seo = {
  /** Shown in Google results and the browser tab. Keep it under ~60 characters. */
  title: 'Adwaidh MP | Full Stack & AI Developer in Kerala, India',
  /** The grey text under the title in Google. Google shows only ~155-160 characters and cuts the rest,
   *  and it tends to replace keyword-packed descriptions with its own text, so this holds the top
   *  search terms only. The wider keyword set lives in `summary`, the services and the FAQ. */
  description:
    'Hire a freelance full stack developer & AI engineer in Kerala, India. Custom software, web apps, AI agents, Python, Django, React, UI/UX & 3D web design.',
  /** The full description, sent to Google in the structured data (no length limit there). */
  summary:
    'Adwaidh MP is a freelance full stack developer, software engineer and AI engineer in Kannur, Kerala, India. He builds custom software and web applications (front-end and back-end), SaaS products and MVPs, business and e-commerce websites, REST APIs, AI agents, AI chatbots, WhatsApp bots and generative AI integrations with Python, Django, FastAPI, React and Laravel, plus UI/UX design and 3D websites. Available to hire for freelance, remote or full-time work, at affordable rates.',
  /** Short role line used in the footer and the main heading for screen readers and search engines. */
  role: 'Full Stack & AI Developer',
  /** Researched from Upwork's 2026 in-demand skills (full-stack development is #1, then web design,
   *  front-end, back-end, e-commerce and UX/UI design; AI integration is among the fastest growing),
   *  the wording of hiring sites (Toptal, Arc, Freelancer, Indeed: "hire full stack developers") and
   *  Kerala web agencies ("website design and development"). Only list work you actually do. */
  keywords: [
    // hiring
    'hire full stack developer', 'full stack developer for hire', 'hire a developer', 'hire software developer',
    'freelance developer', 'freelance full stack developer', 'freelance web developer', 'remote developer India',
    'affordable web developer', 'low cost website developer',
    // roles
    'full stack developer', 'software developer', 'software engineer', 'web developer', 'website developer',
    'front-end developer', 'back-end developer', 'Python developer', 'Python full stack developer',
    'Django developer', 'FastAPI developer', 'React developer', 'Laravel developer',
    // AI
    'AI developer', 'AI engineer', 'agentic AI developer', 'AI agent developer', 'AI chatbot developer',
    'generative AI developer', 'LLM engineer', 'AI integration', 'MCP server developer', 'RAG developer',
    'WhatsApp bot developer', 'WhatsApp chatbot', 'WhatsApp automation',
    // services
    'custom software development', 'web application development', 'software development services',
    'website design and development', 'e-commerce website development', 'SaaS development', 'MVP development', 'API development',
    // design
    'UI/UX designer', 'UI designer', 'web designer', '3D website developer', 'Three.js developer',
    // places
    'full stack developer Kerala', 'web developer Kannur', 'freelance developer India',
  ],
  ogImage: '/og.png',
};

/** "What I can build for you" — the Services section, and the services listed for search engines. */
export const services: {
  title: string;
  text: string;
  tags: string[];
  /** Spans the whole row (use for one highlighted service at the end). */
  wide?: boolean;
  /** Optional link shown at the bottom of the card. */
  link?: { label: string; href: string };
}[] = [
  {
    title: 'Full stack web & software development',
    text: 'Custom software and web applications built end to end, front-end and back-end: SaaS products and MVPs for startups, admin dashboards and internal tools, with Python (Django, FastAPI) or Laravel and React.',
    tags: ['Custom software', 'Web apps', 'SaaS', 'MVP', 'Python', 'Django', 'React'],
  },
  {
    title: 'AI agents & chatbots',
    text: 'AI agents and chatbots on the Claude and OpenAI APIs that answer from your own data (RAG) and take real actions through MCP tools, plus generative AI integrated into your existing software.',
    tags: ['Agentic AI', 'AI integration', 'Generative AI', 'Claude API', 'OpenAI', 'MCP', 'RAG'],
  },
  {
    title: 'Website design & development',
    text: 'Fast, mobile-friendly and SEO-ready websites, landing pages and e-commerce sites with online payments, for small businesses, startups and personal brands, at affordable freelance rates.',
    tags: ['Business websites', 'E-commerce', 'Landing pages', 'SEO', 'Affordable'],
  },
  {
    title: 'UI/UX design',
    text: 'Clean, modern UI/UX for web apps, dashboards and landing pages, designed and then built to match your brand, on phones and desktops.',
    tags: ['UI/UX design', 'Web design', 'Dashboards', 'Responsive', 'Tailwind CSS'],
  },
  {
    title: '3D & interactive websites',
    text: 'Websites with 3D scenes and smooth scroll animations using Three.js and GSAP, like this portfolio, built to stay fast with fallbacks for older devices.',
    tags: ['Three.js', 'GSAP', '3D web design', 'Animation'],
  },
  {
    title: 'APIs, integrations & deployment',
    text: 'REST APIs, background jobs, Slack, Google and Razorpay integrations, and deployment on AWS, Cloudflare and Docker so your app stays up.',
    tags: ['REST APIs', 'Celery', 'AWS', 'Docker', 'Integrations'],
  },
  {
    title: 'WhatsApp bots & automation',
    text: 'WhatsApp chatbots for your business on the official WhatsApp Business API: AI that answers customer questions 24/7 in English or Malayalam, takes orders and bookings, sends updates and reminders, and hands the chat to a person when needed. Connected to your website, CRM or database.',
    tags: ['WhatsApp bot', 'WhatsApp Business API', 'AI chatbot', 'Automation', 'Orders & bookings', 'Python'],
    wide: true,
    link: { label: 'Try it: message me on WhatsApp', href: '#message' },
  },
];

/** The FAQ section, written the way people actually search. Also sent to Google as FAQ data. */
export const faq: { q: string; a: string }[] = [
  {
    q: 'Can I hire you as a freelance full stack developer?',
    a: 'Yes. I take freelance and contract projects: full stack web apps, AI agents and chatbots, business websites and APIs. I am also open to full-time roles, remote or on-site. Send me a message with what you need.',
  },
  {
    q: 'I need a website for my small business but my budget is low. Can you help?',
    a: 'Yes. I work at affordable rates and price each project on its own, so you only pay for what you need. Tell me your budget and I will suggest what fits, from a simple landing page to a full web app.',
  },
  {
    q: 'Do you build AI chatbots and AI agents for businesses?',
    a: 'Yes, that is my main focus. I build AI agents and chatbots on the Claude and OpenAI APIs that answer from your own data (RAG) and take real actions through MCP tools, like the in-app AI assistant and the autonomous coding agent I built for Desklog.',
  },
  {
    q: 'Can you make a WhatsApp bot for my business?',
    a: 'Yes. I build WhatsApp bots on the official WhatsApp Business API that reply to customers 24/7, answer questions with AI from your own information, take orders and bookings, and send updates and reminders. The bot can talk in English or Malayalam and pass the chat to you when a person is needed.',
  },
  {
    q: 'Are you a Python developer or a full stack developer?',
    a: 'Both. Python is my main language (Django, DRF, FastAPI), and I also build the frontend with React and Tailwind CSS, plus Laravel/PHP and Node.js when a project needs them. So one developer can handle your whole app.',
  },
  {
    q: 'What kind of software can you build for me?',
    a: 'Custom software and web applications: SaaS products and MVPs for startups, admin dashboards and internal tools, e-commerce websites with online payments, business websites and landing pages, REST APIs, and AI features such as chatbots, AI agents and generative AI added to your existing software. I handle the front-end, back-end, database and deployment.',
  },
  {
    q: 'Do you do UI design and 3D websites?',
    a: 'Yes. I design and build modern UI for web apps, dashboards and landing pages, and I make interactive 3D websites with Three.js and GSAP. This portfolio is one example.',
  },
  {
    q: 'Where are you based? Can you work remotely?',
    a: 'I am based in Kannur, Kerala, India. I work remotely with clients across Kerala (Kochi, Kozhikode, Thrissur, Thiruvananthapuram), the rest of India and abroad, and I am open to relocating, including to the GCC (UAE, Saudi Arabia, Qatar).',
  },
  {
    q: 'Do you speak Malayalam?',
    a: 'Yes. I speak English, Malayalam and Hindi, so we can talk in whichever is easier for you.',
  },
  {
    q: 'How do I hire you or get a quote?',
    a: 'Send me a WhatsApp message with the box below, use the contact form, email adwaidh7727@gmail.com or call +91 9656367727. Tell me what you need and your budget, and I will reply with a plan and a price.',
  },
];

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
  /** WhatsApp number for the message box at the end of the page: country code + number, digits only. */
  whatsapp: '919656367727',
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
  'What are his personal details?',
  "What's his education?",
  'Can I download his resume?',
  'How can I contact him?',
];

/** Words that scroll in the red marquee strips. */
/** The big banner between Skills and Experience. */
export const availabilityBanner = ['Open to AI roles', 'AI Engineer', 'Agentic AI Developer', 'LLM Engineer', 'Generative AI Engineer', 'Applied AI Engineer', 'Python Full-Stack', 'Full-time', 'Freelance', 'Remote', 'Open to GCC relocation'];

export const marquee = ['AI Agents', 'MCP Servers', 'Agentic Chat', 'Claude API', 'LangGraph', 'RAG', 'Python Backends', 'FastAPI', 'Django'];
