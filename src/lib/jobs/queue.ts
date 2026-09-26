import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import type { Job } from "@prisma/client";
import { INLINE_WORKER_ID } from "@/lib/jobs/identity";

export type JobType = "fulfill_order" | "send_email" | "daily_report" | "maintenance";

export type JobPayloads = {
  fulfill_order: { orderId: string };
  send_email: { to: string; subject: string; text: string; html?: string };
  daily_report: { period?: "DAILY" | "WEEKLY" };
  maintenance: Record<string, never>;
};

/**
 * Enqueue a background job. With JOBS_INLINE=true the job runs immediately in-process (dev/test, and
 * production without a dedicated worker), so the full pipeline works without a worker. Inline jobs are
 * created already RUNNING/locked so a concurrent job loop (embedded worker) cannot claim them too;
 * if the process dies mid-run they are handed back on shutdown (or requeued as stale) and retried by the loop.
 */
export async function enqueue<T extends JobType>(
  type: T,
  payload: JobPayloads[T],
  opts: { runAt?: Date; orderId?: string; maxAttempts?: number; defer?: boolean } = {},
): Promise<Job> {
  const inline = env().JOBS_INLINE && !opts.runAt;
  const job = await prisma.job.create({
    data: {
      type,
      payload: payload as object,
      runAt: opts.runAt ?? new Date(),
      orderId: opts.orderId,
      maxAttempts: opts.maxAttempts ?? 3,
      ...(inline ? { status: "RUNNING", lockedAt: new Date(), lockedBy: INLINE_WORKER_ID, attempts: 1 } : {}),
    },
  });
  if (inline) {
    const { runJob } = await import("@/lib/jobs/runner");
    const run = () => runJob(job.id, INLINE_WORKER_ID);
    if (opts.defer) {
      // Inside a Next.js request (e.g. the Stripe webhook) run after the response is sent so Stripe gets a fast 200.
      // Outside a request scope (worker, tests, scripts) `after()` throws and we simply run now.
      try {
        const { after } = await import("next/server");
        after(run);
        return job;
      } catch {
        // fall through
      }
    }
    await run();
  }
  return job;
}

/** Claim the next runnable job with row-level locking (safe with several worker processes). */
export async function claimNextJob(workerId: string): Promise<Job | null> {
  const rows = await prisma.$queryRaw<Job[]>`
    UPDATE "Job" SET status = 'RUNNING', "lockedAt" = now(), "lockedBy" = ${workerId}, attempts = attempts + 1, "updatedAt" = now()
    WHERE id = (
      SELECT id FROM "Job"
      WHERE status = 'QUEUED' AND "runAt" <= now()
      ORDER BY "runAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *`;
  return rows[0] ?? null;
}

/** Jobs stuck in RUNNING for too long (crashed worker) go back to the queue. */
export async function requeueStaleJobs(staleMinutes = 15): Promise<number> {
  const res = await prisma.job.updateMany({
    where: { status: "RUNNING", lockedAt: { lt: new Date(Date.now() - staleMinutes * 60 * 1000) } },
    data: { status: "QUEUED", lockedAt: null, lockedBy: null, lastError: "requeued: stale lock" },
  });
  if (res.count > 0) log.warn("jobs.requeued_stale", { count: res.count });
  return res.count;
}
