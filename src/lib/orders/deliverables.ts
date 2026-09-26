import type { GeneratedOutput } from "@prisma/client";

/**
 * Which outputs of an order reach the customer.
 *
 * An order can collect several sets of outputs: a QC-flagged run followed by an admin re-run, or a free redo after
 * delivery. The customer must only ever see one coherent set — the one that was delivered last — in the order it
 * was generated, so "version 1" on the order page is the file named `-v1`. The admin page keeps every run.
 */
type OutputLike = Pick<GeneratedOutput, "id" | "type" | "title" | "toolRunId" | "createdAt" | "deliveredAt">;

const byGeneration = (a: OutputLike, b: OutputLike) =>
  a.createdAt.getTime() - b.createdAt.getTime() || a.title.localeCompare(b.title, "en", { numeric: true });

/**
 * The set a delivery sends: every output of the newest pipeline run that produced any, in generation order,
 * followed by the newest manual delivery link (concierge tools), if there is one.
 */
export function outputsToDeliver<T extends OutputLike>(outputs: readonly T[]): T[] {
  let newest: T | undefined;
  for (const o of outputs) {
    if (o.toolRunId && (!newest || o.createdAt.getTime() > newest.createdAt.getTime())) newest = o;
  }
  const runId = newest?.toolRunId;
  const fromRun = runId ? outputs.filter((o) => o.toolRunId === runId).sort(byGeneration) : [];
  const link = outputs
    .filter((o) => !o.toolRunId && o.type === "LINK")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return link ? [...fromRun, link] : fromRun;
}

/** The set the customer currently has: the latest delivery, in generation order (links last). Empty until delivered. */
export function deliveredOutputs<T extends OutputLike>(outputs: readonly T[]): T[] {
  let last = 0;
  for (const o of outputs) {
    const t = o.deliveredAt?.getTime() ?? 0;
    if (t > last) last = t;
  }
  if (last === 0) return [];
  const set = outputs.filter((o) => o.deliveredAt?.getTime() === last);
  return [...set.filter((o) => o.type !== "LINK").sort(byGeneration), ...set.filter((o) => o.type === "LINK")];
}

/** When the customer last received files (a redo moves this; `Order.deliveredAt` keeps the first delivery for SLA metrics). */
export function lastDeliveredAt(outputs: readonly OutputLike[]): Date | null {
  let last: Date | null = null;
  for (const o of outputs) if (o.deliveredAt && (!last || o.deliveredAt > last)) last = o.deliveredAt;
  return last;
}
