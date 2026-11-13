CREATE TABLE jobs (
  id            TEXT PRIMARY KEY,   -- "{ats}:{company}:{ats_job_id}"
  company       TEXT NOT NULL,
  ats           TEXT NOT NULL,
  title         TEXT NOT NULL,
  location      TEXT,
  url           TEXT NOT NULL,
  posted_at     TEXT,               -- ISO, from the ATS when available
  first_seen    TEXT NOT NULL,      -- ISO, when we first saw it
  notified      INTEGER NOT NULL DEFAULT 0,
  matched       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_jobs_notified ON jobs(notified, matched);

CREATE TABLE fetch_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  company    TEXT NOT NULL,
  ats        TEXT NOT NULL,
  ok         INTEGER NOT NULL,
  jobs_found INTEGER,
  error      TEXT,
  ran_at     TEXT NOT NULL
);

CREATE TABLE state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
