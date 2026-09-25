/**
 * Next.js instrumentation hook — runs once when the server process starts (not during `next build`).
 * Starts the embedded job worker so a single-service deployment still gets retries, maintenance and
 * the daily CEO report. The Node-only import sits inside the `NEXT_RUNTIME === "nodejs"` branch, which
 * the bundler evaluates at build time, so nothing Node-specific ends up in the edge (middleware) bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "test") return;
    const { startEmbeddedWorker } = await import("@/lib/jobs/embedded");
    startEmbeddedWorker().catch((err: unknown) => {
      // A worker that cannot start must never take the web server down with it.
      process.stderr.write(JSON.stringify({ t: new Date().toISOString(), level: "error", msg: "worker.embedded_start_failed", error: (err as Error).message }) + "\n");
    });
  }
}
