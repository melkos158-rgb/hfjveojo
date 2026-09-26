import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { reportError } from "@/lib/errors";
import { complete, completeStructured, editImage, type AiCall, type AiCallContext } from "@/lib/ai";
import { AiProviderError } from "@/lib/ai/types";
import { getToolById } from "@/lib/tools/registry";
import type { PipelineContext, PipelineResult } from "@/lib/tools/types";
import { putFile } from "@/lib/storage";
import { enqueue } from "@/lib/jobs/queue";
import { deliverOrder, notifyAdmins } from "@/lib/orders/service";
import { track } from "@/lib/analytics/events";
import { RUN_HEARTBEAT_MS, abandonRuns, beat, liveRunOf } from "@/lib/orders/runs";

const MAX_ORDER_ATTEMPTS = 3;

/**
 * Fulfil a PAID order: run the tool pipeline, store outputs, run QC, then deliver (AUTO) or park in REVIEW (MANUAL/HYBRID/QC flag).
 * Idempotent: COMPLETED/REVIEW orders are not re-run by a duplicate job, and of two jobs for the same order only one
 * moves it to PROCESSING. A PROCESSING order whose run lost its heartbeat (worker restarted or crashed) is taken over.
 */
export async function fulfillOrder(orderId: string): Promise<void> {
  const order = await loadOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.status === "PROCESSING") {
    const live = await liveRunOf(orderId);
    if (live) {
      log.info("fulfill.skip_running", { orderId, runId: live.runId, lastBeatAt: live.lastBeatAt.toISOString() });
      return;
    }
    await abandonRuns(orderId, "abandoned: no heartbeat (worker restarted or crashed)");
    log.warn("fulfill.take_over", { orderId });
  } else if (!["PAID", "RETRYING"].includes(order.status)) {
    log.info("fulfill.skip", { orderId, status: order.status });
    return;
  }
  const def = getToolById(order.toolId);
  if (!def) throw new Error(`Tool definition ${order.toolId} is not registered`);

  const attempts = order.attempts + 1;
  // Conditional on the state we read: a concurrent job for the same order finds nothing to claim and stops here.
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, status: order.status, attempts: order.attempts },
    data: { status: "PROCESSING", startedAt: order.startedAt ?? new Date(), attempts },
  });
  if (claimed.count === 0) {
    log.info("fulfill.skip_claimed", { orderId });
    return;
  }
  const run = await prisma.toolRun.create({
    data: { orderId, toolId: order.toolId, toolVersion: order.toolVersion, steps: [], heartbeatAt: new Date() },
  });
  // Outputs are numbered by run (1 = first run) so the admin can tell a re-run or a redo from the original set.
  const runNumber = await prisma.toolRun.count({ where: { orderId } });

  const steps: Array<{ step: string; note?: string; at: string }> = [];
  // Heartbeat while the pipeline works (a multi-room order takes minutes): keeps the job's lock fresh and shows live steps.
  const heartbeat = setInterval(() => {
    beat(run.id, orderId, steps as object[]).catch((err: Error) => log.warn("fulfill.heartbeat_failed", { orderId, error: err.message }));
  }, RUN_HEARTBEAT_MS);
  heartbeat.unref?.();
  try {
    await runAndFinish({ orderId, order, def, run, runNumber, attempts, steps });
  } finally {
    clearInterval(heartbeat);
  }
}

type RunArgs = {
  orderId: string;
  order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>;
  def: NonNullable<ReturnType<typeof getToolById>>;
  run: { id: string };
  runNumber: number;
  attempts: number;
  steps: Array<{ step: string; note?: string; at: string }>;
};

function loadOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: { tool: true } });
}

async function runAndFinish({ orderId, order, def, run, runNumber, attempts, steps }: RunArgs): Promise<void> {
  const aiCtx: AiCallContext = { purpose: "generate", orderId, toolRunId: run.id, toolId: order.toolId, userId: order.userId };
  let costMicros = 0;

  const ctx: PipelineContext<unknown> = {
    orderId,
    orderNumber: order.number,
    customerEmail: order.customerEmail,
    intake: order.intake,
    step: (name, note) => {
      steps.push({ step: name, note, at: new Date().toISOString() });
      log.info("fulfill.step", { orderId, step: name, note });
    },
    ai: {
      ctx: aiCtx,
      complete: async (call: AiCall, purpose: string) => {
        const r = await complete(call, { ...aiCtx, purpose });
        costMicros += r.costMicros;
        return r;
      },
      completeStructured: async (call, purpose) => {
        const r = await completeStructured(call, { ...aiCtx, purpose });
        costMicros += r.costMicros;
        return r;
      },
      editImage: async (call, purpose) => {
        const r = await editImage(call, { ...aiCtx, purpose });
        costMicros += r.costMicros;
        return r;
      },
    },
  };

  let result: PipelineResult;
  try {
    // Re-validate intake against the current schema: never trust stored JSON blindly.
    const intake = def.intake.schema.parse(order.intake);
    result = await def.run({ ...ctx, intake });
  } catch (err) {
    const message = String((err as Error).message ?? err).slice(0, 1000);
    const ours = await prisma.toolRun.updateMany({
      where: { id: run.id, status: "RUNNING", finishedAt: null },
      data: { status: "FAILED", error: message, steps: steps as object[], costMicros, finishedAt: new Date() },
    });
    if (ours.count === 0) {
      // This run was declared abandoned (shutdown or lost heartbeat) and another run owns the order now.
      log.warn("fulfill.abandoned_run_failed", { orderId, runId: run.id, error: message });
      return;
    }
    // A configuration problem (missing API key, invalid model) will not fix itself in 2 minutes: park the order
    // for a human right away instead of burning retries, and tell the admin exactly what to fix.
    const configProblem = err instanceof AiProviderError && !err.retryable;
    if (configProblem) {
      // A human will finish this one; promise a day, not the usual minutes, so the order page stays honest.
      const humanDueAt = new Date(Date.now() + 24 * 3600 * 1000);
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "REVIEW", errorMessage: message, ...(order.dueAt && order.dueAt < humanDueAt ? { dueAt: humanDueAt } : {}) },
      });
      await reportError(err, { orderId, runId: run.id, attempts, configProblem: true });
      await notifyAdmins(
        `Order #${order.number} needs you — AI provider not usable`,
        `Tool: ${def.name}\nProblem: ${message}\nFix the configuration (Railway → Variables) and press "Retry" on /admin/orders/${orderId}, or fulfil it by hand and deliver.`,
      );
      await track("order_parked", { orderId, props: { tool: def.id, reason: "ai_config" } });
      return;
    }
    const giveUp = attempts >= MAX_ORDER_ATTEMPTS;
    await prisma.order.update({
      where: { id: orderId },
      data: { status: giveUp ? "FAILED" : "RETRYING", errorMessage: message },
    });
    await reportError(err, { orderId, runId: run.id, attempts, giveUp });
    if (giveUp) {
      await notifyAdmins(`Order #${order.number} FAILED after ${attempts} attempts`, `Tool: ${def.name}\nError: ${message}\nOpen /admin/orders/${orderId}`);
      await track("order_failed", { orderId, props: { tool: def.id, attempts } });
    } else {
      await enqueue("fulfill_order", { orderId }, { orderId, runAt: new Date(Date.now() + 2 * 60_000 * attempts) });
    }
    return;
  }

  // Still ours? A run declared abandoned while its AI calls were in flight drops its results: the new owner re-runs.
  const stillOurs = await prisma.toolRun.count({ where: { id: run.id, status: "RUNNING", finishedAt: null } });
  if (stillOurs === 0) {
    log.warn("fulfill.abandoned_run_finished", { orderId, runId: run.id, outputs: result.outputs.length });
    return;
  }

  // Persist outputs
  for (const out of result.outputs) {
    let fileId: string | undefined;
    if (out.file) {
      const f = await putFile({ orderId, userId: order.userId, kind: "OUTPUT", name: out.file.name, mime: out.file.mime, data: out.file.data });
      fileId = f.id;
    }
    await prisma.generatedOutput.create({
      data: {
        orderId,
        toolRunId: run.id,
        type: out.type,
        title: out.title,
        fileId,
        content: out.content === undefined ? undefined : (out.content as object),
        previewText: out.previewText,
        version: runNumber,
      },
    });
  }

  const qcPassed = result.qc.passed;
  const finished = await prisma.toolRun.updateMany({
    where: { id: run.id, status: "RUNNING", finishedAt: null },
    data: { status: qcPassed ? "SUCCEEDED" : "QC_FLAGGED", steps: steps as object[], costMicros, finishedAt: new Date() },
  });
  if (finished.count === 0) {
    log.warn("fulfill.abandoned_while_saving", { orderId, runId: run.id });
    return;
  }

  const needsReview = result.needsHuman || !qcPassed || def.fulfillment !== "AUTO";
  if (needsReview) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REVIEW",
        qcStatus: qcPassed ? "PASSED" : "FLAGGED",
        qcNotes: result.qc.notes.join("\n") || null,
        dueAt: order.dueAt ?? new Date(Date.now() + def.sla.deliveryHours * 3600 * 1000),
      },
    });
    await notifyAdmins(
      `Order #${order.number} needs review (${def.name})`,
      `${result.needsHuman ? "Concierge fulfilment required." : "QC flagged the output."}\n${result.qc.notes.join("\n")}\nOpen /admin/orders/${orderId}`,
    );
    await track("order_review", { orderId, props: { tool: def.id, qcPassed, needsHuman: result.needsHuman } });
    return;
  }

  await prisma.order.update({ where: { id: orderId }, data: { qcStatus: "PASSED", qcNotes: null } });
  await deliverOrder(orderId, { by: "system" });
}
