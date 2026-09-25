import "./load-env";
import { hostname } from "node:os";
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { log } from "../src/lib/logger";
import { claimNextJob, requeueStaleJobs, enqueue } from "../src/lib/jobs/queue";
import { runJob } from "../src/lib/jobs/runner";

/**
 * Background worker: polls the Job table with SKIP LOCKED, runs jobs with bounded concurrency,
 * schedules the daily CEO report and maintenance. Run as a separate Railway service: `npm run worker`.
 */
const e = env();
const workerId = `${hostname()}-${process.pid}`;
let running = 0;
let stopping = false;

async function scheduleDailyReportIfDue() {
  const now = new Date();
  // 06:10 UTC daily; guard against duplicates by checking today's report
  if (now.getUTCHours() !== 6 || now.getUTCMinutes() > 14) return;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const existing = await prisma.ceoReport.findFirst({ where: { period: "DAILY", createdAt: { gte: start } } });
  const pending = await prisma.job.findFirst({ where: { type: "daily_report", status: { in: ["QUEUED", "RUNNING"] } } });
  if (!existing && !pending) {
    await enqueue("daily_report", { period: "DAILY" });
    if (now.getUTCDay() === 1) await enqueue("daily_report", { period: "WEEKLY" });
  }
}

async function scheduleMaintenanceIfDue() {
  const now = new Date();
  if (now.getUTCMinutes() > 4) return; // once per hour, first minutes
  const recent = await prisma.job.findFirst({ where: { type: "maintenance", createdAt: { gte: new Date(Date.now() - 55 * 60_000) } } });
  if (!recent) await enqueue("maintenance", {});
}

async function tick() {
  if (stopping) return;
  try {
    await scheduleDailyReportIfDue();
    await scheduleMaintenanceIfDue();
    while (running < e.WORKER_CONCURRENCY) {
      const job = await claimNextJob(workerId);
      if (!job) break;
      running++;
      void runJob(job.id, workerId).finally(() => {
        running--;
      });
    }
  } catch (err) {
    log.error("worker.tick_failed", { error: (err as Error).message });
  }
}

async function main() {
  log.info("worker.start", { workerId, concurrency: e.WORKER_CONCURRENCY, pollMs: e.WORKER_POLL_MS, provider: e.AI_PROVIDER });
  await requeueStaleJobs();
  const timer = setInterval(tick, e.WORKER_POLL_MS);
  await tick();
  const stop = async () => {
    stopping = true;
    clearInterval(timer);
    log.info("worker.stopping", { running });
    const deadline = Date.now() + 25_000;
    while (running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250));
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

main().catch((err) => {
  log.error("worker.fatal", { error: (err as Error).message });
  process.exit(1);
});
