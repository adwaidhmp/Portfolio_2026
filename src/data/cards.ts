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
};

/** Order along the strip (index 0 leads). */
export const wheelCards: CardSpec[] = [
  { id: 'profile', bg: 'white', motif: 'profile', big: 'AM', label: 'Adwaidh MP', sub: 'AI Engineer' },
  { id: 'python', bg: 'accent', motif: 'py', big: 'PY', label: 'Python', sub: 'Primary language' },
  { id: 'llm', bg: 'black', motif: 'spark', big: 'LLM', label: 'Claude API · OpenAI', sub: 'Agents in production' },
  { id: 'fastapi', bg: 'accent', motif: 'bolt', big: 'FASTAPI', label: 'FastAPI', sub: 'Async services' },
  { id: 'celery', bg: 'white', motif: 'queue', big: 'CELERY', label: 'Redis · RabbitMQ', sub: 'Tasks & caching' },
  { id: 'graph', bg: 'accent', motif: 'graph', big: 'GRAPH', label: 'LangGraph · LangChain', sub: 'Agent workflows' },
  { id: 'rag', bg: 'grey', motif: 'rings', big: 'RAG', label: 'ChromaDB', sub: 'Retrieval pipelines' },
  { id: 'docker', bg: 'black', motif: 'cloud', big: 'DOCKER', label: 'AWS · Nginx · Linux', sub: 'EC2 · S3 · RDS · CI/CD' },
  { id: 'sql', bg: 'white', motif: 'db', big: 'SQL', label: 'PostgreSQL · MySQL', sub: 'SQLite' },
  { id: 'react', bg: 'black', motif: 'jsx', big: 'REACT', label: 'JavaScript', sub: 'Redux Toolkit · Tailwind' },
  { id: 'django', bg: 'accent', motif: 'stack', big: 'DJANGO', label: 'Django · DRF', sub: 'REST · JWT · OAuth' },
  { id: 'mcp', bg: 'black', motif: 'mcp', big: 'MCP', label: 'Model Context Protocol', sub: '2 servers shipped' },
];
