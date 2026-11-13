import type { Ats, CompanyConfig, NormalizedJob } from "../types";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchAshby } from "./ashby";
import { fetchSmartRecruiters } from "./smartrecruiters";

type Adapter = (slug: string) => Promise<NormalizedJob[]>;

const ADAPTERS: Record<Ats, Adapter> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
};

export interface FetchResult {
  company: CompanyConfig;
  ok: boolean;
  jobs: NormalizedJob[];
  error?: string;
}

// One company failing must never take down the tick (section 3 / 11).
export async function fetchCompany(
  company: CompanyConfig
): Promise<FetchResult> {
  try {
    const jobs = await ADAPTERS[company.ats](company.slug);
    return { company, ok: true, jobs };
  } catch (err) {
    return {
      company,
      ok: false,
      jobs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
