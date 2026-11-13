import type { NormalizedJob } from "../types";

// Verified 2026-09-06 against developers.smartrecruiters.com/docs/objects
// and /docs/endpoints. Matches the build plan. Note: the public /postings
// endpoint does not return a candidate-facing URL (only an internal `ref`
// API link), so the public jobs.smartrecruiters.com URL is constructed by
// convention -- same pattern used by every third-party reader of this API.
interface SmartRecruitersLocation {
  city?: string;
  region?: string;
  country?: string;
  remote?: boolean;
}

interface SmartRecruitersPosting {
  id: string;
  name: string;
  releasedDate?: string | null;
  location?: SmartRecruitersLocation;
}

interface SmartRecruitersResponse {
  totalFound: number;
  limit: number;
  offset: number;
  content: SmartRecruitersPosting[];
}

function buildLocationString(loc?: SmartRecruitersLocation): string | null {
  if (!loc) return null;
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  if (loc.remote) parts.push("Remote");
  return parts.length > 0 ? parts.join(", ") : null;
}

const PAGE_SIZE = 100;

// Cloudflare Workers Free caps a single invocation at 50 EXTERNAL
// subrequests total -- shared across every ATS fetch AND the final Resend
// send in the same tick. A huge SmartRecruiters board (e.g. Bosch, ~4,800
// postings) can burn nearly the whole budget on pagination alone, starving
// every other company and the digest email that runs after them. Capping
// pages here protects the whole tick, not just this one adapter.
const MAX_PAGES = 3;

export async function fetchSmartRecruiters(
  slug: string
): Promise<NormalizedJob[]> {
  const all: SmartRecruitersPosting[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(
        slug
      )}/postings?limit=${PAGE_SIZE}&offset=${offset}`
    );
    if (!res.ok) {
      throw new Error(`SmartRecruiters ${slug}: HTTP ${res.status}`);
    }
    const data = (await res.json()) as SmartRecruitersResponse;
    all.push(...data.content);
    offset += data.content.length;
    if (data.content.length === 0 || offset >= data.totalFound) break;
  }

  return all.map((posting) => ({
    atsJobId: posting.id,
    title: posting.name,
    location: buildLocationString(posting.location),
    url: `https://jobs.smartrecruiters.com/${slug}/${posting.id}`,
    postedAt: posting.releasedDate ?? null,
    // The public /postings list endpoint has no description field (only
    // the single-posting detail endpoint does, and fetching that per job
    // would reopen the subrequest problem already fixed once). Jobs from
    // this adapter fall back to title-only matching -- see filter.ts.
    description: null,
  }));
}