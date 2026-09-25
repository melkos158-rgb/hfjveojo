import "./load-env";
import { hostname } from "node:os";
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { log } from "../src/lib/logger";
import { createJobLoop } from "../src/lib/jobs/loop";

/**
 * Dedicated background worker (optional): the same job loop the web process embeds, with higher
 * concurrency and a faster poll. Run as a separate Railway service with `npm run worker` and set
 * EMBEDDED_WORKER=false on the web service so only one loop schedules the daily report/maintenance.
 */
const e = env();
const loop = createJobLoop({
  workerId: `${hostname()}-${process.pid}`,
  pollMs: e.WORKER_POLL_MS,
  concurrency: e.WORKER_CONCURRENCY,
  schedule: true,
});

async function main() {
  log.info("worker.boot", { provider: e.AI_PROVIDER, inline: e.JOBS_INLINE });
  await loop.start();
  const stop = async () => {
    await loop.stop(25_000);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
  // keep the process alive (the loop timer is unref'd on purpose)
  setInterval(() => undefined, 60_000);
}

main().catch((err) => {
  log.error("worker.fatal", { error: (err as Error).message });
  process.exit(1);
});
