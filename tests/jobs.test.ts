import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { claimNextJob, requeueStaleJobs } from "@/lib/jobs/queue";
import { runJob } from "@/lib/jobs/runner";
import { rateLimit } from "@/lib/security/ratelimit";
import { RateLimitedError } from "@/lib/errors";
import { resetDatabase } from "./helpers";

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
});

describe("rate limiter", () => {
  it("throws after the limit within a window", async () => {
    const key = `test:${Date.now()}`;
    await rateLimit({ key, limit: 2, windowSeconds: 60 });
    await rateLimit({ key, limit: 2, windowSeconds: 60 });
    await expect(rateLimit({ key, limit: 2, windowSeconds: 60 })).rejects.toBeInstanceOf(RateLimitedError);
  });
});
