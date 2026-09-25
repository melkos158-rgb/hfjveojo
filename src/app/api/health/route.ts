import { prisma } from "@/lib/db";
import { embeddedWorkerState } from "@/lib/jobs/embedded";

export const dynamic = "force-dynamic";

/** Railway healthcheck. Reports DB connectivity, queue depth and the embedded worker heartbeat; never exposes secrets. */
export async function GET() {
  const started = Date.now();
  try {
    const [queued, failed, running] = await Promise.all([
      prisma.job.count({ where: { status: "QUEUED" } }),
      prisma.job.count({ where: { status: "FAILED" } }),
      prisma.job.count({ where: { status: "RUNNING" } }),
    ]);
    return Response.json({
      ok: true,
      db: "up",
      jobs: { queued, running, failed },
      worker: embeddedWorkerState(),
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version ?? "0.1.0",
    });
  } catch (err) {
    return Response.json({ ok: false, db: "down", error: (err as Error).message.slice(0, 200) }, { status: 503 });
  }
}
