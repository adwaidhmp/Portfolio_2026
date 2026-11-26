/* Cards on the hero strip (they glide right → left on a gentle curve under the name) — your stack and languages.
   Used by both the 3D strip (drawn to canvas textures) and the CSS strip
   shown before WebGL loads / without WebGL. */

export type CardMotif = 'profile' | 'py' | 'spark' | 'bolt' | 'queue' | 'graph' | 'rings' | 'cloud' | 'db' | 'jsx' | 'stack' | 'mcp';
export type CardBg = 'accent' | 'black' | 'white' | 'grey';

export type CardSpec = {
  id: string;
  bg: CardBg;
  motif: CardMotif;
  /** Big word at the bottom of the card (the Python card draws "PY" as its artwork instead). */
  big?: string;
  label: string;
  sub?: string;
  /** Back of the card (shown when it flips on hover): where you've used this. Keep each line short. */
  back?: { where: string; what: string }[];
};

/** Order along the strip (index 0 leads). */
export const wheelCards: CardSpec[] = [
  // the profile card's back is the "about me" (profile.headline / aboutShort / keywords in portfolio.ts)
  { id: 'profile', bg: 'white', motif: 'profile', big: 'AM', label: 'Adwaidh MP', sub: 'AI Engineer' },
  { id: 'python', bg: 'accent', motif: 'py', big: 'PY', label: 'Python', sub: 'Primary language', back: [
    { where: 'Bridgeon', what: 'REST APIs & services in Django, DRF and FastAPI' },
    { where: 'FitAI', what: 'Microservices + an AI assistant service in FastAPI' },
    { where: 'FitAI', what: 'SVC intent & safety classifiers before the LLM' },
  ] },
  { id: 'llm', bg: 'black', motif: 'spark', big: 'LLM', label: 'Claude API · OpenAI', sub: 'Agents in production', back: [
    { where: 'Desklog', what: 'Autonomous coding agent on the Claude API' },
    { where: 'Desklog', what: 'In-app AI agent that answers and acts from chat' },
    { where: 'Desklog', what: 'Claude Code & Codex plugin tracking AI usage' },
  ] },
  { id: 'fastapi', bg: 'accent', motif: 'bolt', big: 'FASTAPI', label: 'FastAPI', sub: 'Async services', back: [
    { where: 'Bridgeon', what: 'REST APIs and backend services with auth & roles' },
    { where: 'FitAI', what: 'Hybrid AI assistant: classifiers, RAG and LangGraph' },
  ] },
  { id: 'celery', bg: 'white', motif: 'queue', big: 'CELERY', label: 'Redis · RabbitMQ', sub: 'Tasks & caching', back: [
    { where: 'Bridgeon', what: 'Emails, notifications, scheduled jobs & AI tasks on RabbitMQ' },
    { where: 'Bridgeon', what: 'Redis caching to speed up APIs' },
    { where: 'FitAI', what: 'Razorpay renewals via Celery Beat, SQS & Lambda' },
  ] },
  { id: 'graph', bg: 'accent', motif: 'graph', big: 'GRAPH', label: 'LangGraph · LangChain', sub: 'Agent workflows', back: [
    { where: 'FitAI', what: 'LangGraph workflow for the AI knowledge assistant' },
    { where: 'FitAI', what: 'LangChain RAG over ChromaDB' },
    { where: 'FitAI', what: 'LLM runs only after ML + retrieval checks' },
  ] },
  { id: 'rag', bg: 'grey', motif: 'rings', big: 'RAG', label: 'ChromaDB', sub: 'Retrieval pipelines', back: [
    { where: 'FitAI', what: 'RAG with LangChain + ChromaDB' },
    { where: 'FitAI', what: 'Retrieval checks before the LLM to stop hallucinations' },
  ] },
  { id: 'docker', bg: 'black', motif: 'cloud', big: 'DOCKER', label: 'AWS · Nginx · Linux', sub: 'EC2 · S3 · RDS · CI/CD', back: [
    { where: 'Bridgeon', what: 'Docker on AWS EC2, RDS & S3 with Nginx, Gunicorn and CI/CD' },
    { where: 'Desklog', what: 'Deploys on AWS, Cloudflare & Contabo (Linux, PM2, cron)' },
  ] },
  { id: 'sql', bg: 'white', motif: 'db', big: 'SQL', label: 'PostgreSQL · MySQL', sub: 'SQLite', back: [
    { where: 'Desklog', what: 'MySQL for a multi-tenant SaaS: optimization, indexing & caching' },
    { where: 'Bridgeon', what: 'Relational data on AWS RDS behind Django APIs' },
  ] },
  { id: 'react', bg: 'black', motif: 'jsx', big: 'REACT', label: 'JavaScript', sub: 'Redux Toolkit · Tailwind', back: [
    { where: 'Bridgeon', what: 'Responsive frontends in React.js, Redux Toolkit & Tailwind' },
    { where: 'This site', what: 'Built with Astro, Three.js and GSAP' },
  ] },
  { id: 'django', bg: 'accent', motif: 'stack', big: 'DJANGO', label: 'Django · DRF', sub: 'REST · JWT · OAuth', back: [
    { where: 'Bridgeon', what: 'REST APIs with DRF, auth and role-based access' },
    { where: 'FitAI', what: 'Admin, Trainer & User services with JWT, OAuth, OTP' },
    { where: 'FitAI', what: 'Live chat & video with Channels, WebSockets, WebRTC' },
  ] },
  { id: 'mcp', bg: 'black', motif: 'mcp', big: 'MCP', label: 'Model Context Protocol', sub: '2 servers shipped', back: [
    { where: 'Desklog', what: 'MCP servers for Desklog & Desklog CRM' },
    { where: 'Desklog', what: 'Claude & ChatGPT read and act on product data' },
    { where: 'Desklog', what: 'In-app agent with MCP tool calling' },
  ] },
];
