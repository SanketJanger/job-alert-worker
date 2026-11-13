import type { ClassifiedJob, CompanyConfig, UnnotifiedJobRow } from "./types";

export function jobRowId(ats: string, company: string, atsJobId: string): string {
  return `${ats}:${company}:${atsJobId}`;
}

// INSERT OR IGNORE on the composite id is what makes dedupe free, including
// the repost case: a reposted requisition keeps its ATS job id and will not
// re-alert. `seeded` controls the backfill guard (section 8, step 9): on the
// very first run every row is pre-marked notified so the first email isn't
// a dump of everything already open.
export async function insertJobs(
  db: D1Database,
  company: CompanyConfig,
  jobs: ClassifiedJob[],
  seeded: boolean
): Promise<number> {
  if (jobs.length === 0) return 0;

  const now = new Date().toISOString();
  const notified = seeded ? 0 : 1;
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO jobs
       (id, company, ats, title, location, url, posted_at, first_seen, notified, matched, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = jobs.map((job) =>
    stmt.bind(
      jobRowId(company.ats, company.slug, job.atsJobId),
      company.slug,
      company.ats,
      job.title,
      job.location,
      job.url,
      job.postedAt,
      now,
      notified,
      job.matched ? 1 : 0,
      job.description
    )
  );

  const results = await db.batch(batch);
  return results.filter((r) => (r.meta?.changes ?? 0) > 0).length;
}

export async function logFetch(
  db: D1Database,
  company: CompanyConfig,
  ok: boolean,
  jobsFound: number,
  error?: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO fetch_log (company, ats, ok, jobs_found, error, ran_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      company.slug,
      company.ats,
      ok ? 1 : 0,
      jobsFound,
      error ?? null,
      new Date().toISOString()
    )
    .run();
}

export async function getState(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare(`SELECT value FROM state WHERE key = ?`)
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setState(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .bind(key, value)
    .run();
}

export async function getUnnotifiedMatches(db: D1Database): Promise<UnnotifiedJobRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company, title, location, url
       FROM jobs
       WHERE notified = 0 AND matched = 1
       ORDER BY company, title`
    )
    .all<UnnotifiedJobRow>();
  return results;
}

// Only ever called after Resend confirms a 200 -- see index.ts.
export async function markNotified(db: D1Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const stmt = db.prepare(`UPDATE jobs SET notified = 1 WHERE id = ?`);
  await db.batch(ids.map((id) => stmt.bind(id)));
}

// Re-runs the current filter against every row already in the table,
// without re-fetching any ATS. Useful every time filters.ts or
// resume-skills.ts changes -- tuning the lists shouldn't require burning
// another round of live requests just to see the effect. Rows inserted
// before the description column existed have description = NULL, which
// passesFilter treats as "no penalty" -- so reclassifying old rows never
// makes them worse, only new fetches actually get resume-skill scrutiny.
export async function reclassifyAll(
  db: D1Database,
  classify: (
    title: string,
    location: string | null,
    description: string | null
  ) => boolean
): Promise<{ total: number; changed: number }> {
  const { results } = await db
    .prepare(`SELECT id, title, location, description, matched FROM jobs`)
    .all<{
      id: string;
      title: string;
      location: string | null;
      description: string | null;
      matched: number;
    }>();

  const stmt = db.prepare(`UPDATE jobs SET matched = ? WHERE id = ?`);
  const CHUNK = 500;
  let changed = 0;

  for (let i = 0; i < results.length; i += CHUNK) {
    const slice = results.slice(i, i + CHUNK);
    const batch = [];
    for (const row of slice) {
      const newMatched = classify(row.title, row.location, row.description)
        ? 1
        : 0;
      if (newMatched !== row.matched) {
        batch.push(stmt.bind(newMatched, row.id));
        changed++;
      }
    }
    if (batch.length > 0) {
      await db.batch(batch);
    }
  }

  return { total: results.length, changed };
}