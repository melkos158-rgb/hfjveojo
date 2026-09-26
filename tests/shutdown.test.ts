import { beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createJobLoop } from "@/lib/jobs/loop";
import { shutdownGraceMs } from "@/lib/jobs/embedded";
import { resetDatabase } from "./helpers";

// A job that never finishes on its own: the test releases it after the loop has been stopped.
let releaseEmail: () => void = () => undefined;
vi.mock("@/lib/email", () => ({
  sendEmail: () =>
    new Promise<void>((resolve) => {
      releaseEmail = resolve;
    }),
}));

describe("worker shutdown", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("hands this process's in-flight jobs back to the queue and leaves other workers' jobs alone", async () => {
    const loop = createJobLoop({ workerId: "w-shutdown", pollMs: 60_000, concurrency: 1, schedule: false, ownedLockIds: ["inline:test-host-1"] });
    const mine = await prisma.job.create({ data: { type: "send_email", payload: { to: "a@example.com", subject: "x", text: "y" } } });
    const inline = await prisma.job.create({
      data: { type: "maintenance", payload: {}, status: "RUNNING", lockedAt: new Date(), lockedBy: "inline:test-host-1", attempts: 1 },
    });
    const theirs = await prisma.job.create({
      data: { type: "maintenance", payload: {}, status: "RUNNING", lockedAt: new Date(), lockedBy: "web-other-replica-7", attempts: 1 },
    });

    await loop.tick();
    expect(loop.state.running).toBe(1);
    const claimed = await prisma.job.findUniqueOrThrow({ where: { id: mine.id } });
    expect(claimed.status).toBe("RUNNING");
    expect(claimed.lockedBy).toBe("w-shutdown");
    expect(claimed.attempts).toBe(1);

    const { requeued } = await loop.stop(100);
    expect(requeued).toBe(2);
    const [a, b, c] = await Promise.all([
      prisma.job.findUniqueOrThrow({ where: { id: mine.id } }),
      prisma.job.findUniqueOrThrow({ where: { id: inline.id } }),
      prisma.job.findUniqueOrThrow({ where: { id: theirs.id } }),
    ]);
    expect(a.status).toBe("QUEUED");
    expect(a.lockedBy).toBeNull();
    expect(a.attempts).toBe(0); // the interrupted attempt does not count
    expect(a.lastError).toBe("requeued: worker shutdown");
    expect(b.status).toBe("QUEUED");
    expect(b.attempts).toBe(0);
    expect(c.status).toBe("RUNNING");
    expect(c.lockedBy).toBe("web-other-replica-7");

    // The abandoned run finishing late must not overwrite the requeued job (it no longer holds the lock).
    releaseEmail();
    const deadline = Date.now() + 5_000;
    while (loop.state.running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
    expect(loop.state.running).toBe(0);
    const after = await prisma.job.findUniqueOrThrow({ where: { id: mine.id } });
    expect(after.status).toBe("QUEUED");
    expect(after.lockedBy).toBeNull();
  });

  it("derives the grace period from Railway's draining window", () => {
    expect(shutdownGraceMs(Number.NaN)).toBe(1500); // Railway default: 3s → leave 1.5s to requeue and exit
    expect(shutdownGraceMs(30)).toBe(28_500);
    expect(shutdownGraceMs(1)).toBe(500);
    expect(shutdownGraceMs(600)).toBe(120_000);
  });
});
