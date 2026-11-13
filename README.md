# Job Alert Worker

Built against the build plan, steps 1-7 (scaffold through filter). Everything
that needed verifying against real data was checked before being written:

- Migration: applied to a local D1 instance here, confirmed all 3 tables.
- All source: compiles clean with `tsc --noEmit` against real
  `@cloudflare/workers-types`.
- `wrangler dev` boots and simulates D1 locally without touching your
  Cloudflare account.
- Greenhouse, Lever, SmartRecruiters adapters: verified field-by-field
  against each ATS's current public docs.
- Ashby adapter: **deviates from the original plan**. The documented
  response has no `id` field at all. The dedupe key is extracted from the
  UUID embedded in `jobUrl`'s last path segment instead
  (`jobs.ashbyhq.com/{board}/{uuid}`). See the comment in
  `src/adapters/ashby.ts`.

What I could **not** verify from the sandbox this was built in: no network
access to the ATS APIs themselves or to Cloudflare's API, so live fetches,
the actual dedupe run, and deploy all need to happen on your machine. The
steps below are the doc's own build order, with the exact commands.

## 0. Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in your real Resend key + addresses
```

## Step 1 — Scaffold (done, verify locally)

```bash
npm run dev            # wrangler dev --test-scheduled
```
In another terminal:
```bash
curl http://localhost:8787/__scheduled
```
You should see a console log from the scheduled handler firing. There's
also a `GET /__manual-run` route wired in for convenience — it awaits the
full tick and returns once it's done, which is easier to eyeball than the
`/__scheduled` fire-and-forget.

## Step 2 — D1 (done locally, verify remote)

You'll need a real D1 database first (this sandbox can't create one):
```bash
npx wrangler d1 create job-alert-worker-db
```
Copy the `database_id` it prints into `wrangler.toml` (currently a
placeholder). Then:
```bash
npm run db:migrate:local
npm run db:migrate:remote
npm run db:tables:local
```
Expect `jobs`, `fetch_log`, `state` (plus `sqlite_sequence` and Wrangler's
own `_cf_METADATA` — both harmless).

## Step 3 — One adapter, live

Greenhouse is already wired with a real, doc-verified schema, but the
plan's own rule stands: eyeball it against a live board before trusting it.
```bash
npm run dev
curl http://localhost:8787/__manual-run
npm run db:matched:local
```
Since the company list already has all four ATS providers configured, this
will actually exercise all of them on the first real run — read `fetch_log`
to see which companies came back `ok = 1`:
```bash
npx wrangler d1 execute job-alert-worker-db --local --command "SELECT company, ats, ok, jobs_found, error FROM fetch_log ORDER BY id DESC LIMIT 40"
```

## Step 4 — Dedupe (the most important gate)

```bash
curl http://localhost:8787/__manual-run
curl http://localhost:8787/__manual-run
npx wrangler d1 execute job-alert-worker-db --local --command "SELECT COUNT(*) FROM jobs"
```
Run the second curl, then check the count didn't grow (beyond any jobs that
genuinely posted between the two calls). If it doubled, stop and debug
before going further — this is the gate the doc calls out by name.

## Step 5 — Remaining adapters

All four are already implemented. Cross-check the `fetch_log` query above
against each company's live board in a browser, the same way you'd verify
one manually built adapter at a time.

## Step 6 — Filter tuning

```bash
npm run db:matched:local
npm run db:unmatched:local
```
Read both. Expect to add/remove a few words in `src/config/filters.ts` —
that's the point of keeping the lists in one file.

## Step 7 — Email

Fill in real values in `.dev.vars`, then:
```bash
npm run dev
curl http://localhost:8787/__manual-run
```
First real run is the seed run — no email by design (see Step 9 below).
Delete the `seeded` row from `state` locally if you want to force a second
"first run," or just wait for the next tick after real jobs appear.

## Step 8 — Deploy

```bash
npm run deploy
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ALERT_EMAIL_TO
npx wrangler secret put ALERT_EMAIL_FROM
```
Then watch two live cron firings:
```bash
npx wrangler tail
```
Confirm `fetch_log` shows `ok = 1` for every company via the remote flag:
```bash
npx wrangler d1 execute job-alert-worker-db --remote --command "SELECT company, ok, error FROM fetch_log ORDER BY id DESC LIMIT 40"
```

## Step 9 — Backfill guard

Already implemented in `src/index.ts` / `src/db.ts`: the `state.seeded` row
controls it, and every row inserted before that flag is set gets
`notified = 1` so the first tick never sends a several-hundred-line dump.

## Notes on scope

- Company list (`src/config/companies.ts`) has all ~34 slugs from the
  plan's section 9 — under the free-tier 50-subrequest cap, so the
  rotating-offset logic mentioned in section 3 isn't needed yet. Add a
  comment there if the list grows past ~45.
- Workday (phase 2 in the plan) is intentionally not built — different
  auth shape, per-tenant paths, budget it separately per the plan's own
  advice.
