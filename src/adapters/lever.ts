import type { NormalizedJob } from "../types";

// Verified 2026-09-06 against Lever's postings-api docs -- bare array,
// `text` is the title, `createdAt` is epoch milliseconds. Matches the
// build plan.
interface LeverPosting {
  id: string;
  text: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  hostedUrl: string;
  createdAt: number;
  description?: string;
}

export async function fetchLever(slug: string): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`
  );
  if (!res.ok) {
    throw new Error(`Lever ${slug}: HTTP ${res.status}`);
  }
  const postings = (await res.json()) as LeverPosting[];
  return postings.map((posting) => ({
    atsJobId: posting.id,
    title: posting.text,
    location: posting.categories?.location ?? null,
    url: posting.hostedUrl,
    postedAt: posting.createdAt
      ? new Date(posting.createdAt).toISOString()
      : null,
    description: posting.description ?? null,
  }));
}