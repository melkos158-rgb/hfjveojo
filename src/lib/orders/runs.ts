import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Pipeline run leases. A running pipeline refreshes its ToolRun heartbeat (and its job's lock) every RUN_HEARTBEAT_MS;
 * a RUNNING run without a heartbeat for RUN_STALE_MS was abandoned — the worker was restarted by a deploy or crashed.
 * Such a run is marked FAILED so its order can be taken over instead of staying in PROCESSING forever, and the old
 * worker, should it still be alive, finds its run no longer RUNNING and drops its results.
 */

export const RUN_HEARTBEAT_MS = 30_000;
/** Four missed heartbeats: longer than any pause of a healthy worker. */
export const RUN_STALE_MS = 2 * 60_000;

export type LiveRun = { runId: string; lastBeatAt: Date };

/** The order's run that is still working (recent heartbeat), if any. */
export async function liveRunOf(orderId: string): Promise<LiveRun | null> {
  const runs = await prisma.toolRun.findMany({
    where: { orderId, status: "RUNNING", finishedAt: null },
    select: { id: true, startedAt: true, heartbeatAt: true },
    orderBy: { startedAt: "desc" },
  });
  const cutoff = Date.now() - RUN_STALE_MS;
  for (const r of runs) {
    const lastBeatAt = r.heartbeatAt ?? r.startedAt;
    if (lastBeatAt.getTime() > cutoff) return { runId: r.id, lastBeatAt };
  }
  return null;
}

/** Mark every unfinished RUNNING run of the order as FAILED (abandoned). Returns how many were closed. */
export async function abandonRuns(orderId: string, reason: string): Promise<number> {
  const res = await prisma.toolRun.updateMany({
    where: { orderId, status: "RUNNING", finishedAt: null },
    data: { status: "FAILED", error: reason.slice(0, 1000), finishedAt: new Date() },
  });
  if (res.count > 0) log.warn("fulfill.runs_abandoned", { orderId, count: res.count, reason });
  return res.count;
}

/**
 * A worker is shutting down while it runs this order (deploy/restart): close the run and put the order back to
 * RETRYING so the re-queued job picks it up at once. A shutdown is not the order's fault, so the attempt is given back.
 */
export async function releaseOrderOnShutdown(orderId: string): Promise<void> {
  await abandonRuns(orderId, "abandoned: worker shutdown (deploy or restart)");
  const given = await prisma.order.updateMany({ where: { id: orderId, status: "PROCESSING", attempts: { gt: 0 } }, data: { status: "RETRYING", attempts: { decrement: 1 } } });
  if (given.count === 0) await prisma.order.updateMany({ where: { id: orderId, status: "PROCESSING" }, data: { status: "RETRYING" } });
}

/** Refresh the run's heartbeat (with the steps so far, so the admin sees live progress) and its job's lock. */
export async function beat(runId: string, orderId: string, steps: object[]): Promise<void> {
  const now = new Date();
  await prisma.toolRun.updateMany({ where: { id: runId, status: "RUNNING", finishedAt: null }, data: { heartbeatAt: now, steps } });
  await prisma.job.updateMany({ where: { orderId, type: "fulfill_order", status: "RUNNING" }, data: { lockedAt: now } });
}
