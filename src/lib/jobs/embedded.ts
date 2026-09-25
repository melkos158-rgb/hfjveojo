import { hostname } from "node:os";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { createJobLoop, type JobLoop } from "@/lib/jobs/loop";

/**
 * Embedded worker: the job loop running inside the Next.js server process, so a single Railway service
 * gets retries, hourly maintenance and the daily CEO report without a separate worker service.
 * Switch it off with EMBEDDED_WORKER=false once a dedicated worker (`npm run worker`) exists.
 * Kept on globalThis so hot reloads and duplicate module instances never start a second loop.
 */
type Slot = { loop: JobLoop | null; started: boolean };
const g = globalThis as unknown as { __orvionisEmbeddedWorker?: Slot };
const slot: Slot = (g.__orvionisEmbeddedWorker ??= { loop: null, started: false });

export function embeddedWorkerState(): { enabled: boolean; workerId?: string; lastTickAt?: string | null; ticks?: number; running?: number } {
  if (!slot.loop) return { enabled: false };
  const s = slot.loop.state;
  return { enabled: true, workerId: s.workerId, lastTickAt: s.lastTickAt?.toISOString() ?? null, ticks: s.ticks, running: s.running };
}

export async function startEmbeddedWorker(): Promise<void> {
  if (slot.started) return;
  slot.started = true;
  const e = env();
  if (!e.EMBEDDED_WORKER) {
    log.info("worker.embedded_disabled", {});
    return;
  }
  const loop = createJobLoop({
    workerId: `web-${hostname()}-${process.pid}`,
    pollMs: e.EMBEDDED_WORKER_POLL_MS,
    concurrency: e.EMBEDDED_WORKER_CONCURRENCY,
    schedule: true,
  });
  slot.loop = loop;
  const stop = () => {
    void loop.stop(10_000);
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  await loop.start();
}
