import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { createJobLoop, type JobLoop } from "@/lib/jobs/loop";
import { EMBEDDED_WORKER_ID, INLINE_WORKER_ID } from "@/lib/jobs/identity";

/**
 * Embedded worker: the job loop running inside the Next.js server process, so a single Railway service
 * gets retries, hourly maintenance and the daily CEO report without a separate worker service.
 * Switch it off with EMBEDDED_WORKER=false once a dedicated worker (`npm run worker`) exists.
 * Kept on globalThis so hot reloads and duplicate module instances never start a second loop.
 *
 * Shutdown: Railway stops the old container with SIGTERM once a new deployment is healthy. The start
 * script runs `NEXT_MANUAL_SIG_HANDLE=true exec next start`, so the signal reaches this process and
 * Next.js leaves the exit to us: stop polling, give in-flight jobs a short grace, hand the rest back to
 * the queue (the new container picks them up seconds later) and exit 0 — no "npm error signal SIGTERM",
 * no customer waiting for the 15-minute stale-lock timeout. Without NEXT_MANUAL_SIG_HANDLE (local
 * `next start`) Next.js exits on its own; we still hand jobs back on a best-effort basis.
 */
type Slot = { loop: JobLoop | null; started: boolean; shuttingDown: boolean };
const g = globalThis as unknown as { __orvionisEmbeddedWorker?: Slot };
const slot: Slot = (g.__orvionisEmbeddedWorker ??= { loop: null, started: false, shuttingDown: false });

export function embeddedWorkerState(): { enabled: boolean; workerId?: string; lastTickAt?: string | null; ticks?: number; running?: number } {
  if (!slot.loop) return { enabled: false };
  const s = slot.loop.state;
  return { enabled: true, workerId: s.workerId, lastTickAt: s.lastTickAt?.toISOString() ?? null, ticks: s.ticks, running: s.running };
}

/**
 * How long in-flight jobs may finish before being handed back. Railway kills the container
 * RAILWAY_DEPLOYMENT_DRAINING_SECONDS after SIGTERM (default 3s), so leave ~1.5s for the requeue + exit.
 */
export function shutdownGraceMs(drainingSeconds = Number(process.env.RAILWAY_DEPLOYMENT_DRAINING_SECONDS)): number {
  const drain = Number.isFinite(drainingSeconds) && drainingSeconds > 0 ? drainingSeconds : 3;
  return Math.max(500, Math.min(drain * 1000 - 1500, 120_000));
}

export async function startEmbeddedWorker(): Promise<void> {
  if (slot.started) return;
  slot.started = true;
  const e = env();
  const loop = e.EMBEDDED_WORKER
    ? createJobLoop({
        workerId: EMBEDDED_WORKER_ID,
        pollMs: e.EMBEDDED_WORKER_POLL_MS,
        concurrency: e.EMBEDDED_WORKER_CONCURRENCY,
        schedule: true,
        ownedLockIds: [INLINE_WORKER_ID],
      })
    : null;
  slot.loop = loop;
  const manual = Boolean(process.env.NEXT_MANUAL_SIG_HANDLE);
  const shutdown = (signal: string) => {
    if (slot.shuttingDown) return;
    slot.shuttingDown = true;
    const graceMs = shutdownGraceMs();
    log.info("server.shutdown", { signal, workerId: loop?.state.workerId ?? null, running: loop?.state.running ?? 0, graceMs, manual });
    const release = loop ? loop.stop(manual ? graceMs : 0) : Promise.resolve({ requeued: 0 });
    if (!manual) {
      // Next.js exits as soon as its HTTP server closes; hand jobs back right away, best effort.
      void release.catch((err) => log.warn("server.shutdown_requeue_failed", { error: (err as Error).message }));
      return;
    }
    const hardExit = setTimeout(() => process.exit(0), graceMs + 1500);
    hardExit.unref();
    release
      .catch((err) => log.warn("server.shutdown_requeue_failed", { error: (err as Error).message }))
      .finally(() => {
        log.info("server.exit", { signal });
        process.exit(0);
      });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  if (!loop) {
    log.info("worker.embedded_disabled", {});
    return;
  }
  await loop.start();
}
