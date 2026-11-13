import type { NormalizedJob } from "../types";

// Verified 2026-09-06 against developers.ashbyhq.com/docs/public-job-posting-api.
//
// IMPORTANT DEVIATION FROM THE BUILD PLAN: the documented response has no
// `id` field at all (checked the full field table, not just a truncated
// example). Ashby job URLs embed a UUID as the last path segment instead --
// e.g. https://jobs.ashbyhq.com/{board}/8f2c1a4e-...-... -- confirmed
// against multiple independent tools reading the same public endpoint.
// So the dedupe key here is extracted from jobUrl, not a top-level id.
interface AshbyJob {
  title: string;
  location: string | null;
  jobUrl: string;
  publishedAt: string | null;
  isListed: boolean;
  descriptionPlain?: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

function extractIdFromUrl(url: string): string {
  const segments = url.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? url;
}

export async function fetchAshby(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`
  );
  if (!res.ok) {
    throw new Error(`Ashby ${slug}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as AshbyResponse;
  return data.jobs
    .filter((job) => job.isListed)
    .map((job) => ({
      atsJobId: extractIdFromUrl(job.jobUrl),
      title: job.title,
      location: job.location ?? null,
      url: job.jobUrl,
      postedAt: job.publishedAt ?? null,
      description: job.descriptionPlain ?? null,
    }));
}