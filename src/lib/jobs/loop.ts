import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { claimNextJob, enqueue, requeueStaleJobs } from "@/lib/jobs/queue";
import { runJob } from "@/lib/jobs/runner";

/**
 * The job loop shared by the dedicated worker (`npm run worker`) and the embedded worker that runs
 * inside the web process (see src/instrumentation.ts). It polls the Job table with SKIP LOCKED,
 * runs jobs with bounded concurrency and schedules the daily CEO report and hourly maintenance.
 * Several loops may run at once (worker + web, or several replicas): claiming is row-locked and the
 * schedulers check for an existing job before enqueueing, so duplicates are prevented, not just unlikely.
 */
export type LoopOptions = {
  workerId: string;
  pollMs: number;
  concurrency: number;
  /** Set false on a loop that only executes jobs (leave scheduling to another loop). */
  schedule?: boolean;
};

export type LoopState = {
  workerId: string;
  startedAt: Date;
  lastTickAt: Date | null;
  ticks: number;
  running: number;
  stopping: boolean;
};

export type JobLoop = {
  state: LoopState;
  /** Run one poll cycle (exported for tests and the HTTP fallback). Resolves when claims are dispatched, not when jobs finish. */
  tick: () => Promise<void>;
  /** Start polling. Idempotent. */
  start: () => Promise<void>;
  /** Stop polling and wait (bounded) for in-flight jobs. */
  stop: (graceMs?: number) => Promise<void>;
};

async function scheduleDailyReportIfDue(): Promise<void> {
  const now = new Date();
  // 06:10–06:14 UTC daily; guarded against duplicates by checking today's report and pending jobs.
  if (now.getUTCHours() !== 6 || now.getUTCMinutes() < 10 || now.getUTCMinutes() > 14) return;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const existing = await prisma.ceoReport.findFirst({ where: { period: "DAILY", createdAt: { gte: start } } });
  const pending = await prisma.job.findFirst({ where: { type: "daily_report", status: { in: ["QUEUED", "RUNNING"] } } });
  if (!existing && !pending) {
    await enqueue("daily_report", { period: "DAILY" });
    if (now.getUTCDay() === 1) await enqueue("daily_report", { period: "WEEKLY" });
  }
}

async function scheduleMaintenanceIfDue(): Promise<void> {
  const now = new Date();
  if (now.getUTCMinutes() > 4) return; // once per hour, in the first minutes
  const recent = await prisma.job.findFirst({ where: { type: "maintenance", createdAt: { gte: new Date(Date.now() - 55 * 60_000) } } });
  if (!recent) await enqueue("maintenance", {});
}

export function createJobLoop(opts: LoopOptions): JobLoop {
  const state: LoopState = { workerId: opts.workerId, startedAt: new Date(), lastTickAt: null, ticks: 0, running: 0, stopping: false };
  let timer: NodeJS.Timeout | null = null;
  let inTick = false;

  async function tick(): Promise<void> {
    if (state.stopping || inTick) return; // never overlap ticks (a slow DB must not pile up polls)
    inTick = true;
    try {
      state.ticks++;
      state.lastTickAt = new Date();
      if (opts.schedule !== false) {
        await scheduleDailyReportIfDue();
        await scheduleMaintenanceIfDue();
      }
      while (state.running < opts.concurrency) {
        const job = await claimNextJob(opts.workerId);
        if (!job) break;
        state.running++;
        void runJob(job.id, opts.workerId)
          .catch((err) => log.error("jobs.run_unhandled", { jobId: job.id, error: (err as Error).message }))
          .finally(() => {
            state.running--;
          });
      }
    } catch (err) {
      log.error("worker.tick_failed", { workerId: opts.workerId, error: (err as Error).message });
    } finally {
      inTick = false;
    }
  }

  async function start(): Promise<void> {
    if (timer) return;
    log.info("worker.start", { workerId: opts.workerId, concurrency: opts.concurrency, pollMs: opts.pollMs, schedule: opts.schedule !== false });
    try {
      await requeueStaleJobs();
    } catch (err) {
      log.warn("worker.requeue_failed", { error: (err as Error).message });
    }
    timer = setInterval(() => void tick(), opts.pollMs);
    timer.unref?.(); // never keep a process alive just for polling
    await tick();
  }

  async function stop(graceMs = 25_000): Promise<void> {
    state.stopping = true;
    if (timer) clearInterval(timer);
    timer = null;
    log.info("worker.stopping", { workerId: opts.workerId, running: state.running });
    const deadline = Date.now() + graceMs;
    while (state.running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250));
  }

  return { state, tick, start, stop };
}
