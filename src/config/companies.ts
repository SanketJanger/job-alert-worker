import type { CompanyConfig } from "../types";

// Slugs from the build plan's section 9. Confirm each returns 200 before
// relying on it (see README "verify the company list" step) -- a few of
// these were "derived from observed apply URLs" and may have drifted.
export const COMPANIES: CompanyConfig[] = [
  // Ashby
  { slug: "plaid", ats: "ashby" },
  { slug: "notion", ats: "ashby" },
  { slug: "sierra", ats: "ashby" },
  { slug: "valon", ats: "ashby" },
  { slug: "ontic", ats: "ashby" },
  { slug: "applied", ats: "ashby" },
  { slug: "trulioo", ats: "ashby" },
  { slug: "composio", ats: "ashby" },
  { slug: "uniswap", ats: "ashby" },
  { slug: "handshake", ats: "ashby" },
  { slug: "mach", ats: "ashby" },
  { slug: "clera", ats: "ashby" },
  { slug: "careerswift", ats: "ashby" },
  { slug: "siftstack", ats: "ashby" },
  { slug: "arch.co", ats: "ashby" },

  // Greenhouse
  { slug: "pagerduty", ats: "greenhouse" },
  { slug: "everlaw", ats: "greenhouse" },
  { slug: "twitch", ats: "greenhouse" },
  { slug: "spacex", ats: "greenhouse" },
  { slug: "andurilindustries", ats: "greenhouse" },
  { slug: "rocketlab", ats: "greenhouse" },
  { slug: "newrelic", ats: "greenhouse" },
  { slug: "blend", ats: "greenhouse" },
  { slug: "generalmatter", ats: "greenhouse" },
  { slug: "selffinancial", ats: "greenhouse" },
  { slug: "torcrobotics", ats: "greenhouse" },
  { slug: "tebra", ats: "greenhouse" },
  { slug: "zyngacareers", ats: "greenhouse" },
  { slug: "accenturefederalservices", ats: "greenhouse" },
  { slug: "fiveringsllc", ats: "greenhouse" },
  { slug: "hudsonrivertrading", ats: "greenhouse" },

  // Lever
  { slug: "zoox", ats: "lever" },
  { slug: "belvederetrading", ats: "lever" },
  { slug: "jobgether", ats: "lever" },

  // SmartRecruiters
  { slug: "BoschGroup", ats: "smartrecruiters" },
];
