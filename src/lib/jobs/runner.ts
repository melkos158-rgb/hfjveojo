import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { reportError } from "@/lib/errors";
import { sendEmail } from "@/lib/email";
import { fulfillOrder } from "@/lib/orders/fulfill";
import { generateCeoReport } from "@/lib/ceo/report";
import { purgeExpiredFiles } from "@/lib/storage";
import { pruneRateLimits } from "@/lib/security/ratelimit";
import { requeueStaleJobs, type JobPayloads } from "@/lib/jobs/queue";

/** Execute one job by id. Used by the worker loop and by inline mode. */
export async function runJob(jobId: string, workerId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status !== "RUNNING") {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "RUNNING", lockedAt: new Date(), lockedBy: workerId, attempts: { increment: 1 } },
    });
  }
  const started = Date.now();
  try {
    switch (job.type) {
      case "fulfill_order": {
        const p = job.payload as JobPayloads["fulfill_order"];
        await fulfillOrder(p.orderId);
        break;
      }
      case "send_email": {
        const p = job.payload as JobPayloads["send_email"];
        await sendEmail(p);
        break;
      }
      case "daily_report": {
        const p = job.payload as JobPayloads["daily_report"];
        await generateCeoReport(p.period ?? "DAILY");
        break;
      }
      case "maintenance": {
        const files = await purgeExpiredFiles();
        const rl = await pruneRateLimits();
        const stale = await requeueStaleJobs();
        // Abandoned checkouts: PENDING orders older than 24h are closed so they stop polluting the funnel.
        const abandoned = await prisma.order.updateMany({
          where: { status: "PENDING", createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
          data: { status: "CANCELED", errorMessage: "abandoned checkout (auto-closed after 24h)" },
        });
        log.info("jobs.maintenance", { files, rateLimitRows: rl, stale, abandoned: abandoned.count });
        break;
      }
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
    await prisma.job.update({ where: { id: jobId }, data: { status: "DONE", lockedAt: null, lockedBy: null } });
    log.info("jobs.done", { jobId, type: job.type, ms: Date.now() - started });
  } catch (err) {
    const attempts = job.status === "RUNNING" ? job.attempts : job.attempts + 1;
    const giveUp = attempts >= job.maxAttempts;
    const backoffMs = Math.min(60_000 * 2 ** attempts, 30 * 60_000);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: giveUp ? "FAILED" : "QUEUED",
        runAt: giveUp ? undefined : new Date(Date.now() + backoffMs),
        lockedAt: null,
        lockedBy: null,
        lastError: String((err as Error).message ?? err).slice(0, 2000),
      },
    });
    await reportError(err, { jobId, type: job.type, attempts, giveUp });
  }
}
