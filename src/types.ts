export type Ats = "greenhouse" | "lever" | "ashby" | "smartrecruiters";

export interface CompanyConfig {
  slug: string;
  ats: Ats;
}

export interface NormalizedJob {
  atsJobId: string;
  title: string;
  location: string | null;
  url: string;
  postedAt: string | null;
  description: string | null;
}

export interface ClassifiedJob extends NormalizedJob {
  matched: boolean;
}

export interface UnnotifiedJobRow {
  id: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
}

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  ALERT_EMAIL_TO: string;
  ALERT_EMAIL_FROM: string;
}