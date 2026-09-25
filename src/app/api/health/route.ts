import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Railway healthcheck. Reports DB connectivity and queue depth; never exposes secrets. */
export async function GET() {
  const started = Date.now();
  try {
    const [queued, failed] = await Promise.all([
      prisma.job.count({ where: { status: "QUEUED" } }),
      prisma.job.count({ where: { status: "FAILED" } }),
    ]);
    return Response.json({ ok: true, db: "up", jobs: { queued, failed }, latencyMs: Date.now() - started, version: process.env.npm_package_version ?? "0.1.0" });
  } catch (err) {
    return Response.json({ ok: false, db: "down", error: (err as Error).message.slice(0, 200) }, { status: 503 });
  }
}
