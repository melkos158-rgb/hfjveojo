import { hostname } from "node:os";

/**
 * Lock identities for the Job table. Every lock names the process that holds it (host + pid), so on
 * shutdown a process can hand back exactly the jobs it was running — never a replica's — and a runner
 * can tell whether it still owns a job before writing its result.
 */
export const PROCESS_ID = `${hostname()}-${process.pid}`;

/** Lock id for jobs run in-process by `enqueue()` (JOBS_INLINE). */
export const INLINE_WORKER_ID = `inline:${PROCESS_ID}`;

/** Lock id for the job loop embedded in the web server (see src/lib/jobs/embedded.ts). */
export const EMBEDDED_WORKER_ID = `web-${PROCESS_ID}`;

/** Every lock id this process can hold — the set to release on shutdown. */
export const OWN_WORKER_IDS = [INLINE_WORKER_ID, EMBEDDED_WORKER_ID];
