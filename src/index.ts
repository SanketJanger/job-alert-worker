import { COMPANIES } from "./config/companies";
import { fetchCompany } from "./adapters";
import { passesFilter } from "./filter";
import {
  insertJobs,
  logFetch,
  getState,
  setState,
  getUnnotifiedMatches,
  markNotified,
  reclassifyAll,
} from "./db";
import { sendDigest } from "./email";
import type { ClassifiedJob, Env } from "./types";

// Job descriptions can be tens of KB per posting at some companies
// (Greenhouse's content=true field includes full HTML plus legal
// boilerplate). Storing that for EVERY fetched job -- not just matched
// ones -- blew past D1's 32MiB per-batch RPC limit on a single large
// company (SpaceX, 2,335 postings, ~40.6MB in one batch). Matching happens
// against the FULL description for accuracy (see below); only the copy
// that gets stored is truncated, since nothing downstream needs more than
// a preview once classification is done.
const MAX_STORED_DESCRIPTION_LENGTH = 3000;

function truncateForStorage(description: string | null): string | null {
  if (!description) return null;
  return description.length > MAX_STORED_DESCRIPTION_LENGTH
    ? description.slice(0, MAX_STORED_DESCRIPTION_LENGTH)
    : description;
}

// Sends whatever is currently unnotified and marks it notified only after a
// successful send. Shared by both crons below -- a job is claimed by
// whichever one gets to it first, so nothing is ever sent twice across the
// two schedules.
async function flushUnnotified(env: Env, label: string): Promise<void> {
  const unnotified = await getUnnotifiedMatches(env.DB);
  if (unnotified.length === 0) {
    console.log(`${label}: nothing unsent.`);
    return;
  }

  try {
    await sendDigest(env, unnotified, label);
    await markNotified(
      env.DB,
      unnotified.map((job) => job.id)
    );
  } catch (err) {
    console.error(`${label} email failed, will retry next run:`, err);
  }
}

// Runs on the hourly cron: fetches every company, stores anything new, then
// sends whatever is unnotified as the "Hourly update." This is the primary,
// real-time path.
async function runHourlyTick(env: Env): Promise<void> {
  const seeded = (await getState(env.DB, "seeded")) === "true";

  for (const company of COMPANIES) {
    const result = await fetchCompany(company);
    await logFetch(env.DB, company, result.ok, result.jobs.length, result.error);

    if (!result.ok) continue;

    const classified: ClassifiedJob[] = result.jobs.map((job) => ({
      ...job,
      matched: passesFilter(job.title, job.location, job.description),
      description: truncateForStorage(job.description),
    }));

    await insertJobs(env.DB, company, classified, seeded);
  }

  if (!seeded) {
    await setState(env.DB, "seeded", "true");
    console.log("Seed run complete -- all rows pre-marked notified.");
    return;
  }

  await flushUnnotified(env, "Hourly update");
}

// Runs on the daily cron: does NOT fetch anything new -- the hourly tick
// keeps the database current. Just flushes whatever's still unnotified as
// the "Daily recap." In normal operation this is empty, since hourly
// already claimed everything; it exists as a safety net for a missed
// hourly run or a prolonged ATS outage, so nothing gets lost permanently.
async function runDailyRecap(env: Env): Promise<void> {
  await flushUnnotified(env, "Daily recap");
}

const HOURLY_CRON = "0 * * * *";
// ~8am US Eastern during daylight time (EDT, UTC-4). Drifts to ~9am ET once
// clocks fall back to EST (UTC-5) in November -- update the UTC hour below
// if that matters to you, or leave it; it's a once-a-year hour of drift on
// a catch-up job that's usually empty anyway.
const DAILY_CRON = "0 12 * * *";

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    if (event.cron === DAILY_CRON) {
      ctx.waitUntil(runDailyRecap(env));
    } else {
      ctx.waitUntil(runHourlyTick(env));
    }
  },

  // Manual triggers for testing without waiting on the actual cron.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/__manual-run") {
      await runHourlyTick(env);
      return new Response("Hourly tick complete. Check the jobs and fetch_log tables.");
    }
    if (url.pathname === "/__manual-daily") {
      await runDailyRecap(env);
      return new Response("Daily recap complete.");
    }
    if (url.pathname === "/__reclassify") {
      const result = await reclassifyAll(env.DB, passesFilter);
      return new Response(
        `Reclassified ${result.total} rows, ${result.changed} changed.`
      );
    }
    return new Response("Job Alert Worker is running. Cron-triggered, no public routes.");
  },
};