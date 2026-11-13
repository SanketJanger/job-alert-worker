// Pulled from the Technical Skills section of Sanket's resume. Checked
// against job DESCRIPTIONS (see filter.ts), not titles -- titles rarely
// name specific tools, descriptions usually do. Edit this list directly
// whenever the resume changes; no other code needs to change.
//
// Matched case-insensitively as whole words/phrases (see the regex build
// in filter.ts), so short entries like "sql" or "git" don't false-positive
// inside unrelated words ("digital", "legitimate", etc.).
//
// Left out on purpose: AI coding assistants (Cursor, Codex, Claude Code) --
// real tools he uses, but not something a job description would ever list
// as a requirement, so they add no matching signal.
export const RESUME_SKILLS = [
  // Languages
  "python",
  "typescript",
  "javascript",
  "sql",
  "html",
  "css",

  // Frameworks and libraries
  "fastapi",
  "node.js",
  "nodejs",
  "express",
  "react",
  "flask",
  "sqlalchemy",
  "alembic",
  "prisma",

  // Datastores
  "postgresql",
  "postgres",
  "mysql",
  "redis",
  "bigquery",
  "chromadb",

  // Messaging / streaming
  "kafka",
  "rabbitmq",
  "websockets",
  "rest api",
  "pub/sub",

  // Cloud and DevOps
  "aws",
  "gcp",
  "cloud run",
  "cloud function",
  "docker",
  "kubernetes",
  "cloudflare",
  "durable objects",
  "git",
  "linux",

  // AI / NLP concepts (excluding the coding-assistant tools, see note above)
  "rag",
  "llm",
  "finbert",
  "sentence-transformers",

  // Networking
  "tcp/ip",
];