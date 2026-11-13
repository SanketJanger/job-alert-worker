import type { NormalizedJob } from "../types";

// Verified 2026-09-06 against https://developers.greenhouse.io/job-board --
// the "List jobs" response matches the build plan exactly. content=true
// adds each job's HTML description in the SAME response -- no extra
// subrequest -- used for resume-skill matching (see filter.ts). Greenhouse
// HTML-entity-encodes this field (e.g. &lt;p&gt;), but that's harmless for
// plain keyword substring matching, so it's stored as-is, untouched.
interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string } | null;
  absolute_url: string;
  updated_at: string;
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouse(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      slug
    )}/jobs?content=true`
  );
  if (!res.ok) {
    throw new Error(`Greenhouse ${slug}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as GreenhouseResponse;
  return data.jobs.map((job) => ({
    atsJobId: String(job.id),
    title: job.title,
    location: job.location?.name ?? null,
    url: job.absolute_url,
    postedAt: job.updated_at ?? null,
    description: job.content ?? null,
  }));
}