import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security/tokens";
import { claimNextJob, requeueStaleJobs } from "@/lib/jobs/queue";
import { runJob } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Fallback job runner for single-service deployments (no worker): a scheduler hits this every minute.
 * Prefer the dedicated worker (npm run worker) in production.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${env().CRON_SECRET}`)) return new Response("Unauthorized", { status: 401 });
  await requeueStaleJobs();
  const max = Math.min(Number(new URL(req.url).searchParams.get("max") ?? 5), 20);
  let ran = 0;
  for (let i = 0; i < max; i++) {
    const job = await claimNextJob("http-runner");
    if (!job) break;
    await runJob(job.id, "http-runner");
    ran++;
  }
  return Response.json({ ok: true, ran });
}
