import {
  TITLE_INCLUDE_NEW_GRAD,
  TITLE_INCLUDE_ROLE,
  TITLE_EXCLUDE,
  NON_US_COUNTRY_MARKERS,
  NON_US_COUNTRY_CODES,
  US_STATE_CODES,
} from "./config/filters";
import { RESUME_SKILLS } from "./config/resume-skills";

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const US_STATE_REGEX = new RegExp(`\\b(${US_STATE_CODES.join("|")})\\b`);
// Deliberately case-sensitive -- see the comment on NON_US_COUNTRY_CODES.
const NON_US_COUNTRY_CODE_REGEX = new RegExp(
  `\\b(${NON_US_COUNTRY_CODES.join("|")})\\b`
);
// Case-insensitive ("i" flag) -- unlike the location codes above, resume
// skills should match regardless of how a description happens to capitalize
// them ("Python", "PYTHON", "python" all count).
const RESUME_SKILLS_REGEX = new RegExp(
  `\\b(${RESUME_SKILLS.map(escapeRegex).join("|")})\\b`,
  "i"
);

export function isUsLocation(location: string | null): boolean {
  // Unknown location: keep it and let the human review pass (step 6) decide.
  if (!location) return true;

  const lower = location.toLowerCase();
  const hasForeignNameMarker = containsAny(lower, NON_US_COUNTRY_MARKERS);
  const hasForeignCodeMarker = NON_US_COUNTRY_CODE_REGEX.test(location);
  if (!hasForeignNameMarker && !hasForeignCodeMarker) return true;

  // A foreign marker showed up, but the string might also carry a US
  // qualifier (dual-listed postings, "Remote - US or India" type strings).
  return (
    lower.includes("united states") ||
    lower.includes("usa") ||
    US_STATE_REGEX.test(location)
  );
}

// No description available (SmartRecruiters, or a Greenhouse/Lever/Ashby
// posting that just didn't include one): don't penalize it, fall back to
// title-only matching as before. Only reject once a description exists
// AND names none of the resume's actual skills.
export function matchesResumeSkills(description: string | null): boolean {
  if (!description) return true;
  return RESUME_SKILLS_REGEX.test(description);
}

export function passesFilter(
  title: string,
  location: string | null,
  description: string | null
): boolean {
  if (containsAny(title, TITLE_EXCLUDE)) return false;

  const matchesNewGrad = containsAny(title, TITLE_INCLUDE_NEW_GRAD);
  const matchesRole = containsAny(title, TITLE_INCLUDE_ROLE);
  if (!matchesNewGrad && !matchesRole) return false;

  if (!isUsLocation(location)) return false;

  if (!matchesResumeSkills(description)) return false;

  return true;
}