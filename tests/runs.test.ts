import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// The text tools call completeStructured; a gate lets a test hold a run mid-pipeline (a worker being shut down).
const { gate } = vi.hoisted(() => ({ gate: { closed: false, waiters: [] as Array<() => void>, entered: 0 } }));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ id: null })) }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...orig,
    completeStructured: async (...args: Parameters<typeof orig.completeStructured>) => {
      gate.entered++;
      if (gate.closed) await new Promise<void>((resolve) => gate.waiters.push(resolve));
      return orig.completeStructured(...args);
    },
  };
});

import { prisma } from "@/lib/db";
import { fulfillOrder } from "@/lib/orders/fulfill";
import { retryOrder } from "@/lib/orders/service";
import { RUN_STALE_MS, releaseOrderOnShutdown } from "@/lib/orders/runs";
import { createJobLoop } from "@/lib/jobs/loop";
import { runJob } from "@/lib/jobs/runner";
import { editImage } from "@/lib/ai";
import { resetDatabase, sampleListingDescriptionIntake } from "./helpers";

const openGate = () => {
  gate.closed = false;
  for (const w of gate.waiters.splice(0)) w();
};

async function makeOrder(status: "PAID" | "PROCESSING" | "RETRYING", attempts = 0) {
  const product = await prisma.product.findFirstOrThrow({ where: { toolId: "listing-description" } });
  return prisma.order.create({
    data: {
      customerEmail: "agent@example.com",
      toolId: "listing-description",
      toolVersion: 1,
      productId: product.id,
      status,
      attempts,
      intake: sampleListingDescriptionIntake as object,
      amountCents: 900,
      accessToken: `runs-${Math.random().toString(36).slice(2)}`,
      paidAt: new Date(),
    },
  });
}

const runOf = (orderId: string, heartbeatAgoMs: number) =>
  prisma.toolRun.create({ data: { orderId, toolId: "listing-description", toolVersion: 1, steps: [], heartbeatAt: new Date(Date.now() - heartbeatAgoMs) } });

async function waitFor(check: () => Promise<boolean>, ms = 5000) {
  const deadline = Date.now() + ms;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("pipeline run leases (deploys and crashes never strand an order)", () => {
  let adminId = "";
  beforeAll(async () => {
    await resetDatabase();
    adminId = (await prisma.user.create({ data: { email: "admin@example.com", role: "ADMIN" } })).id;
  });
  beforeEach(() => openGate());

  it("takes over a PROCESSING order whose run stopped sending heartbeats", async () => {
    const order = await makeOrder("PROCESSING", 1);
    const dead = await runOf(order.id, RUN_STALE_MS + 60_000);
    await fulfillOrder(order.id);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { runs: true, outputs: true } });
    expect(after.status).toBe("COMPLETED");
    expect(after.attempts).toBe(2);
    const old = after.runs.find((r) => r.id === dead.id)!;
    expect(old.status).toBe("FAILED");
    expect(old.error).toMatch(/abandoned/);
    expect(after.runs.filter((r) => r.status === "SUCCEEDED")).toHaveLength(1);
    expect(after.outputs.length).toBeGreaterThan(0);
  });

  it("leaves a PROCESSING order alone while its run is alive, and an admin retry waits for it", async () => {
    const order = await makeOrder("PROCESSING", 1);
    const live = await runOf(order.id, 5_000);
    await fulfillOrder(order.id);
    const same = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { runs: true } });
    expect(same.status).toBe("PROCESSING");
    expect(same.runs).toHaveLength(1);
    await expect(retryOrder(order.id, adminId)).rejects.toMatchObject({ code: "busy", status: 409 });

    // once the run has gone quiet the retry replaces it (and, with inline jobs, finishes the order)
    await prisma.toolRun.update({ where: { id: live.id }, data: { heartbeatAt: new Date(Date.now() - RUN_STALE_MS - 1000) } });
    await retryOrder(order.id, adminId);
    const done = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { runs: true } });
    expect(done.status).toBe("COMPLETED");
    expect(done.runs.find((r) => r.id === live.id)?.status).toBe("FAILED");
  });

  it("of two jobs for the same paid order only one runs the pipeline", async () => {
    const order = await makeOrder("PAID");
    await Promise.all([fulfillOrder(order.id), fulfillOrder(order.id)]);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { runs: true } });
    expect(after.status).toBe("COMPLETED");
    expect(after.runs).toHaveLength(1);
    expect(await prisma.event.count({ where: { name: "order_delivered", orderId: order.id } })).toBe(1);
  });

  it("a worker shutdown mid-pipeline hands the order to the re-queued job; the interrupted run drops its results", async () => {
    const order = await makeOrder("PAID");
    const job = await prisma.job.create({ data: { type: "fulfill_order", payload: { orderId: order.id }, orderId: order.id } });
    gate.closed = true;
    gate.entered = 0;
    const loop = createJobLoop({ workerId: "w-runs", pollMs: 60_000, concurrency: 1, schedule: false });
    await loop.tick();
    await waitFor(async () => gate.entered > 0); // the pipeline is inside its AI call

    const { requeued } = await loop.stop(50);
    expect(requeued).toBe(1);
    const handedBack = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { runs: true } });
    expect(handedBack.status).toBe("RETRYING");
    expect(handedBack.attempts).toBe(0); // a deploy does not cost the customer a retry
    expect(handedBack.runs[0].status).toBe("FAILED");
    expect(handedBack.runs[0].error).toMatch(/worker shutdown/);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("QUEUED");

    // the old process's AI call returns after all: it must not save or deliver anything
    openGate();
    await waitFor(async () => loop.state.running === 0);
    const untouched = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { outputs: true } });
    expect(untouched.status).toBe("RETRYING");
    expect(untouched.outputs).toHaveLength(0);

    // the new process runs the re-queued job
    await runJob(job.id, "w-next");
    const done = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { outputs: true, runs: true } });
    expect(done.status).toBe("COMPLETED");
    expect(done.attempts).toBe(1);
    expect(done.runs.filter((r) => r.status === "SUCCEEDED")).toHaveLength(1);
    const winner = done.runs.find((r) => r.status === "SUCCEEDED")!;
    expect(done.outputs.every((o) => o.toolRunId === winner.id)).toBe(true);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("DONE");
  });

  it("releasing an order that is not processing changes nothing", async () => {
    const order = await makeOrder("RETRYING", 2);
    await releaseOrderOnShutdown(order.id);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "RETRYING", attempts: 2 });
  });

  it("the per-order AI cap scales with the photos in the order", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    const mk = (quantity: number) =>
      prisma.order.create({
        data: { customerEmail: "agent@example.com", toolId: "virtual-staging", productId: product.id, status: "PROCESSING", intake: {}, amountCents: 1500 * quantity, quantity, accessToken: `cap-${quantity}-${Date.now()}` },
      });
    const spent = { provider: "mock", model: "mock", tier: "standard", purpose: "stage", costMicros: 1_500_000, latencyMs: 1, ok: true }; // $1.50, over the $1 default cap
    const one = await mk(1);
    const three = await mk(3);
    await prisma.aiRequest.createMany({ data: [{ ...spent, orderId: one.id }, { ...spent, orderId: three.id }] });
    const photo = Buffer.from("not really an image");
    const call = { image: photo, mime: "image/jpeg", prompt: "stage", n: 1 };
    await expect(editImage(call, { purpose: "stage", orderId: one.id })).rejects.toMatchObject({ code: "ai_budget_exceeded" });
    await expect(editImage(call, { purpose: "stage", orderId: three.id })).resolves.toMatchObject({ images: expect.any(Array) });
  });
});
