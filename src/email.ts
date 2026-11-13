import type { Env, UnnotifiedJobRow } from "./types";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(jobs: UnnotifiedJobRow[]): string {
  const byCompany = new Map<string, UnnotifiedJobRow[]>();
  for (const job of jobs) {
    const list = byCompany.get(job.company) ?? [];
    list.push(job);
    byCompany.set(job.company, list);
  }

  const sections = [...byCompany.entries()]
    .map(([company, companyJobs]) => {
      const items = companyJobs
        .map((job) => {
          const location = job.location ? ` &mdash; ${escapeHtml(job.location)}` : "";
          return `<li><a href="${escapeHtml(job.url)}">${escapeHtml(job.title)}</a>${location}</li>`;
        })
        .join("\n");
      return `<h3>${escapeHtml(company)}</h3>\n<ul>\n${items}\n</ul>`;
    })
    .join("\n");

  return `<div>${sections}</div>`;
}

// Never called with an empty list -- index.ts checks that before calling in.
// Rows are only marked notified by the caller after this resolves without
// throwing, so a Resend failure leaves them to retry on the next run.
export async function sendDigest(
  env: Env,
  jobs: UnnotifiedJobRow[],
  label: string
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const count = jobs.length;
  const subject = `${label}: ${count} new role${count === 1 ? "" : "s"} (${date})`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.ALERT_EMAIL_FROM,
      to: env.ALERT_EMAIL_TO,
      subject,
      html: buildHtml(jobs),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed: HTTP ${res.status} ${body}`);
  }
}