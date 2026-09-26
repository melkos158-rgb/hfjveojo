import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { claimNextJob, enqueue, requeueStaleJobs } from "@/lib/jobs/queue";
import { runJob } from "@/lib/jobs/runner";
import { createJobLoop } from "@/lib/jobs/loop";
import { rateLimit } from "@/lib/security/ratelimit";
import { RateLimitedError } from "@/lib/errors";
import { resetDatabase } from "./helpers";

async function untilIdle(loop: ReturnType<typeof createJobLoop>, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (loop.state.running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
}

describe("job queue", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("claims each queued job exactly once (SKIP LOCKED) and marks it DONE", async () => {
    const job = await prisma.job.create({ data: { type: "maintenance", payload: {} } });
    const a = await claimNextJob("w1");
    const b = await claimNextJob("w2");
    expect(a?.id).toBe(job.id);
    expect(b).toBeNull();
    await runJob(job.id, "w1");
    const after = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(after.status).toBe("DONE");
  });

  it("requeues stale RUNNING jobs and fails unknown job types after max attempts", async () => {
    const stale = await prisma.job.create({ data: { type: "bogus", payload: {}, status: "RUNNING", lockedAt: new Date(Date.now() - 60 * 60_000), maxAttempts: 1 } });
    expect(await requeueStaleJobs(15)).toBe(1);
    const claimed = await claimNextJob("w1");
    expect(claimed?.id).toBe(stale.id);
    await runJob(stale.id, "w1");
    const after = await prisma.job.findUniqueOrThrow({ where: { id: stale.id } });
    expect(after.status).toBe("FAILED");
    expect(after.lastError).toContain("Unknown job type");
  });

  it("inline enqueue creates the job already locked (no double run by a loop) and finishes it", async () => {
    const job = await enqueue("maintenance", {});
    const after = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(job.status).toBe("RUNNING");
    expect(job.lockedBy).toMatch(/^inline:/);
    expect(after.status).toBe("DONE");
    expect(after.attempts).toBe(1);
  });

  it("inline enqueue with a future runAt is scheduled, not run", async () => {
    const job = await enqueue("maintenance", {}, { runAt: new Date(Date.now() + 60_000) });
    expect(job.status).toBe("QUEUED");
    const loop = createJobLoop({ workerId: "loop-test", pollMs: 60_000, concurrency: 1, schedule: false });
    await loop.tick();
    await untilIdle(loop);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("QUEUED"); // not due yet
  });

  it("the job loop claims due jobs with bounded concurrency and runs them to DONE", async () => {
    const due = await Promise.all([
      prisma.job.create({ data: { type: "maintenance", payload: {} } }),
      prisma.job.create({ data: { type: "maintenance", payload: {} } }),
      prisma.job.create({ data: { type: "maintenance", payload: {} } }),
    ]);
    const loop = createJobLoop({ workerId: "loop-test", pollMs: 60_000, concurrency: 2, schedule: false });
    await loop.tick();
    expect(loop.state.running).toBeLessThanOrEqual(2);
    await untilIdle(loop);
    await loop.tick();
    await untilIdle(loop);
    const rows = await prisma.job.findMany({ where: { id: { in: due.map((j) => j.id) } } });
    expect(rows.map((r) => r.status)).toEqual(["DONE", "DONE", "DONE"]);
    expect(loop.state.ticks).toBe(2);
    await loop.stop(1000);
  });
});

describe("rate limiter", () => {
  it("throws after the limit within a window", async () => {
    const key = `test:${Date.now()}`;
    await rateLimit({ key, limit: 2, windowSeconds: 60 });
    await rateLimit({ key, limit: 2, windowSeconds: 60 });
    await expect(rateLimit({ key, limit: 2, windowSeconds: 60 })).rejects.toBeInstanceOf(RateLimitedError);
  });
});
