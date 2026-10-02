import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { AiBudgetExceededError, editImage, todaysSpendMicros, type AiCallContext, type ImageEditCall } from "@/lib/ai";
import { putFile, type PutFileInput } from "@/lib/storage";
import { sniffImage } from "@/lib/security/files";
import {
  VIRTUAL_STAGING_VARIATIONS,
  encodeForDelivery,
  prepareInputPhoto,
  stagingPrompt,
  type StagingStyle,
} from "@/lib/tools/definitions/virtual-staging";
import { LAB_REQUESTS, type LabRequest } from "@/content/lab-requests";

/**
 * Marketing lab: stages the stock photos listed in src/content/lab-requests.ts with the exact customer pipeline
 * (stagingPrompt → editImage with two versions → encodeForDelivery), so marketing shows real output without using
 * anyone's listing. The job loop calls runLabOnce every few minutes; each call does at most one run (one photo in
 * one style) and only when it cannot get in a customer's way:
 *  - production only, and never while a paid order is queued or running;
 *  - today's AI spend plus this run must stay within LAB_BUDGET_SHARE of AI_DAILY_BUDGET_CENTS (orders, free photos
 *    and previews keep the rest), and at most LAB_RUNS_PER_DAY image calls a day;
 *  - a failed run is retried after LAB_RETRY_AFTER_MS, at most LAB_MAX_ATTEMPTS times.
 * Results live in the `Setting` row below; files are kept LAB_FILE_DAYS and listed by /api/lab/manifest.
 */
export const LAB_SETTING = "ops.lab";
export const LAB_BUDGET_SHARE = 0.35;
export const LAB_RUNS_PER_DAY = 16;
export const LAB_RETRY_AFTER_MS = 30 * 60_000;
export const LAB_MAX_ATTEMPTS = 3;
/** A run marks itself in flight for this long, so a second process (or a restart) does not start it again meanwhile. */
export const LAB_LEASE_MS = 10 * 60_000;
export const LAB_FILE_DAYS = 365;
/** The CDN URLs ask for 2048 px (about 0.3–1.5 MB); anything above this is refused, like a customer upload. */
export const LAB_MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
const LAB_HOSTS = new Set(["images.pexels.com", "images.unsplash.com"]);

export type LabFile = { id: string; name: string };
export type LabResult = { files: LabFile[]; at: string; costMicros: number };
export type LabFailure = { attempts: number; lastAt: string; error: string };
export type LabRecord = {
  /** Request id → the photo exactly as the model saw it (after prepareInputPhoto). */
  sources: Record<string, LabFile>;
  /** `${requestId}:${style}` → the staged versions. */
  results: Record<string, LabResult>;
  failures: Record<string, LabFailure>;
  leaseUntil?: string;
};
export type LabRun = { request: LabRequest; style: StagingStyle; key: string };
export type LabOutcome =
  | { ran: string; files: number; costMicros: number }
  | { failed: string; error: string }
  | { skipped: "not production" | "nothing to do" | "waiting" | "busy" | "order in progress" | "budget" | "daily runs" };

type LabStore = {
  setting: {
    findUnique(args: { where: { key: string } }): Promise<{ value: unknown } | null>;
    upsert(args: { where: { key: string }; create: { key: string; value: LabRecord }; update: { value: LabRecord } }): Promise<unknown>;
  };
};
export type LabDeps = {
  appEnv: string;
  requests: readonly LabRequest[];
  db: LabStore;
  now: () => Date;
  fetchImage: (url: string) => Promise<Buffer>;
  edit: (call: ImageEditCall, ctx: AiCallContext) => Promise<{ images: Buffer[]; costMicros: number }>;
  put: (input: PutFileInput) => Promise<{ id: string }>;
  spendTodayMicros: () => Promise<number>;
  labCallsToday: () => Promise<number>;
  ordersInProgress: () => Promise<number>;
  dailyBudgetCents: number;
  imageCostCents: number;
};

export const labKey = (requestId: string, style: string) => `${requestId}:${style}`;

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function labFile(v: unknown): LabFile | null {
  const o = obj(v);
  return typeof o.id === "string" && typeof o.name === "string" ? { id: o.id, name: o.name } : null;
}

export function parseLabRecord(value: unknown): LabRecord {
  const v = obj(value);
  const record: LabRecord = { sources: {}, results: {}, failures: {} };
  for (const [k, s] of Object.entries(obj(v.sources))) {
    const f = labFile(s);
    if (f) record.sources[k] = f;
  }
  for (const [k, r] of Object.entries(obj(v.results))) {
    const o = obj(r);
    const files = Array.isArray(o.files) ? o.files.map(labFile).filter((f): f is LabFile => !!f) : [];
    if (files.length) record.results[k] = { files, at: String(o.at ?? ""), costMicros: Number(o.costMicros) || 0 };
  }
  for (const [k, f] of Object.entries(obj(v.failures))) {
    const o = obj(f);
    record.failures[k] = { attempts: Number(o.attempts) || 0, lastAt: String(o.lastAt ?? ""), error: String(o.error ?? "") };
  }
  if (typeof v.leaseUntil === "string") record.leaseUntil = v.leaseUntil;
  return record;
}

/** Runs not done yet that may still be tried (`ready` excludes the ones waiting out a retry delay), in file order. */
export function labRuns(requests: readonly LabRequest[], record: LabRecord, now: Date): { remaining: LabRun[]; ready: LabRun[] } {
  const remaining: LabRun[] = [];
  const ready: LabRun[] = [];
  for (const request of requests) {
    for (const style of request.styles) {
      const key = labKey(request.id, style);
      if (record.results[key]) continue;
      const failure = record.failures[key];
      if (failure && failure.attempts >= LAB_MAX_ATTEMPTS) continue;
      remaining.push({ request, style, key });
      const lastAt = failure ? Date.parse(failure.lastAt) : NaN;
      if (!failure || !(now.getTime() - lastAt < LAB_RETRY_AFTER_MS)) ready.push({ request, style, key });
    }
  }
  return { remaining, ready };
}

/** Lab photos come only from the two stock-photo CDNs, over https. */
export function isAllowedLabUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password && !u.port && LAB_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

async function fetchLabImage(url: string): Promise<Buffer> {
  if (!isAllowedLabUrl(url)) throw new Error("photo URL is not on an allowed stock-photo host");
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { "User-Agent": "ORVIONIS-lab/1.0 (+https://orvionis.com)" } });
  if (res.url && !isAllowedLabUrl(res.url)) throw new Error("photo URL redirected off the stock-photo host");
  if (!res.ok) throw new Error(`photo download failed: HTTP ${res.status}`);
  if (Number(res.headers.get("content-length") ?? 0) > LAB_MAX_DOWNLOAD_BYTES) throw new Error("photo larger than 8 MB");
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > LAB_MAX_DOWNLOAD_BYTES) throw new Error("photo larger than 8 MB");
  return data;
}

function defaultDeps(): LabDeps {
  const e = env();
  return {
    appEnv: e.APP_ENV,
    requests: LAB_REQUESTS,
    db: prisma,
    now: () => new Date(),
    fetchImage: fetchLabImage,
    edit: editImage,
    put: putFile,
    spendTodayMicros: todaysSpendMicros,
    labCallsToday: () => {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      return prisma.aiRequest.count({ where: { purpose: "lab", createdAt: { gte: start } } });
    },
    ordersInProgress: () => prisma.job.count({ where: { type: "fulfill_order", status: { in: ["QUEUED", "RUNNING"] } } }),
    dailyBudgetCents: e.AI_DAILY_BUDGET_CENTS,
    imageCostCents: e.AI_IMAGE_COST_CENTS,
  };
}

const extOf = (mime: string) => (mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg");

/** At most one lab run. Never throws for a failed run: the failure is recorded and retried later. */
export async function runLabOnce(overrides: Partial<LabDeps> = {}): Promise<LabOutcome> {
  const d: LabDeps = { ...defaultDeps(), ...overrides };
  if (d.appEnv !== "production") return { skipped: "not production" };
  const now = d.now();
  const save = (value: LabRecord) => d.db.setting.upsert({ where: { key: LAB_SETTING }, create: { key: LAB_SETTING, value }, update: { value } });

  const record = parseLabRecord((await d.db.setting.findUnique({ where: { key: LAB_SETTING } }))?.value);
  const { remaining, ready } = labRuns(d.requests, record, now);
  if (!remaining.length) return { skipped: "nothing to do" };
  if (!ready.length) return { skipped: "waiting" };
  if (record.leaseUntil && Date.parse(record.leaseUntil) > now.getTime()) return { skipped: "busy" };
  if ((await d.ordersInProgress()) > 0) return { skipped: "order in progress" };
  const runMicros = Math.round((d.imageCostCents * VIRTUAL_STAGING_VARIATIONS + 1) * 10_000);
  if (d.dailyBudgetCents > 0 && (await d.spendTodayMicros()) + runMicros > d.dailyBudgetCents * 10_000 * LAB_BUDGET_SHARE) return { skipped: "budget" };
  if ((await d.labCallsToday()) >= LAB_RUNS_PER_DAY) return { skipped: "daily runs" };

  const run = ready[0];
  const { request, style, key } = run;
  record.leaseUntil = new Date(now.getTime() + LAB_LEASE_MS).toISOString();
  await save(record);
  try {
    const raw = await d.fetchImage(request.imageUrl);
    const photo = await prepareInputPhoto(raw, sniffImage(raw).mime);
    if (!record.sources[request.id]) {
      const name = `lab-${request.id}-source.${extOf(photo.mime)}`;
      const file = await d.put({ kind: "INPUT", name, mime: photo.mime, data: photo.data, expiresInDays: LAB_FILE_DAYS });
      record.sources[request.id] = { id: file.id, name };
    }
    const prompt = stagingPrompt({ roomType: request.roomType, style, notes: request.notes ?? "" });
    const { images, costMicros } = await d.edit(
      { image: photo.data, mime: photo.mime, prompt, n: VIRTUAL_STAGING_VARIATIONS, size: "auto", inputWidth: photo.width, inputHeight: photo.height },
      { purpose: "lab", toolId: "virtual-staging" },
    );
    if (!images.length) throw new Error("the image model returned no images");
    const files: LabFile[] = [];
    for (const [i, img] of images.entries()) {
      const enc = await encodeForDelivery(img);
      const name = `lab-${request.id}-${style}-v${i + 1}.${enc.ext}`;
      const file = await d.put({ kind: "OUTPUT", name, mime: enc.mime, data: enc.data, expiresInDays: LAB_FILE_DAYS });
      files.push({ id: file.id, name });
    }
    record.results[key] = { files, at: d.now().toISOString(), costMicros };
    delete record.failures[key];
    delete record.leaseUntil;
    await save(record);
    log.info("lab.ran", { key, files: files.length, costMicros });
    return { ran: key, files: files.length, costMicros };
  } catch (err) {
    delete record.leaseUntil;
    const message = (err as Error).message ?? String(err);
    if (err instanceof AiBudgetExceededError) {
      // The daily cap or the kill switch: not the run's fault, so it is not counted as an attempt.
      await save(record);
      return { skipped: "budget" };
    }
    const attempts = (record.failures[key]?.attempts ?? 0) + 1;
    record.failures[key] = { attempts, lastAt: d.now().toISOString(), error: message.slice(0, 300) };
    await save(record);
    log.warn("lab.run_failed", { key, attempts, error: message });
    return { failed: key, error: message };
  }
}

/** The finished runs as {name, url} for the media bridge: lab/<id>/<file name>, sources first. */
export function labManifest(record: LabRecord, requests: readonly LabRequest[], sign: (fileId: string) => string): Array<{ name: string; url: string }> {
  const out: Array<{ name: string; url: string }> = [];
  for (const request of requests) {
    const source = record.sources[request.id];
    if (source) out.push({ name: `lab/${request.id}/${source.name}`, url: sign(source.id) });
    for (const style of request.styles) {
      for (const f of record.results[labKey(request.id, style)]?.files ?? []) out.push({ name: `lab/${request.id}/${f.name}`, url: sign(f.id) });
    }
  }
  return out;
}
