// Netlify Scheduled Function — fires daily at 09:00 UTC (configured in netlify.toml).
// Hits the /api/cron/expiry endpoint on the same site, guarded by CRON_SECRET.

export default async (_request, _context) => {
  const origin = process.env.URL ?? process.env.WEB_ORIGIN ?? "http://localhost:8888";
  const secret = process.env.CRON_SECRET ?? "";

  const res = await fetch(`${origin}/api/cron/expiry`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });

  const body = await res.text();
  console.log(`[expiry-cron] status=${res.status} body=${body}`);

  return new Response(body, { status: res.status });
};
