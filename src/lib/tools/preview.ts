import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError, RateLimitedError } from "@/lib/errors";
import { editImage, todaysSpendMicros } from "@/lib/ai";
import { getToolBySlug } from "@/lib/tools/registry";
import { track } from "@/lib/analytics/events";
import { rateLimit } from "@/lib/security/ratelimit";
import type { IntakeField } from "@/lib/tools/types";

/**
 * Free preview before payment: one version of the visitor's own photo, downsized and watermarked, so they can
 * judge the result on their room instead of a sample. Costs real AI money, so it is capped three ways:
 * FREE_PREVIEWS_PER_DAY (all visitors), FREE_PREVIEWS_PER_IP, and a share of the daily AI budget — paid orders
 * always keep the rest. Nothing is stored: the watermarked JPEG goes back in the response.
 */

/** Longest edge of the preview (the paid result is 1536 px and unwatermarked). */
export const PREVIEW_LONG_EDGE = 1024;
/** Previews stop once today's AI spend reaches this share of AI_DAILY_BUDGET_CENTS. */
export const PREVIEW_BUDGET_SHARE = 0.4;

const QUOTA_MESSAGE = "Today's free previews are used up — try again tomorrow, or order now (one redo is included if the result isn't right).";

let assets: { tile: Buffer; banner: Buffer } | null = null;
async function watermarkAssets(): Promise<{ tile: Buffer; banner: Buffer }> {
  if (!assets) {
    const dir = join(process.cwd(), "public", "brand");
    assets = { tile: await readFile(join(dir, "preview-watermark.png")), banner: await readFile(join(dir, "preview-banner.png")) };
  }
  return assets;
}

/**
 * Downsize to PREVIEW_LONG_EDGE, repeat the "ORVIONIS · PREVIEW" mark across the whole photo and add the bottom
 * banner. The marks are pre-rendered PNGs (public/brand/preview-*.png), so no fonts are needed on the server.
 */
export async function watermarkPreview(image: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  const { tile, banner } = await watermarkAssets();
  const { data: base, info } = await sharp(image)
    .rotate()
    .resize({ width: PREVIEW_LONG_EDGE, height: PREVIEW_LONG_EDGE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const tileMeta = await sharp(tile).metadata();
  const fitsTile = (tileMeta.width ?? 0) <= info.width && (tileMeta.height ?? 0) <= info.height;
  const tileIn = fitsTile ? tile : await sharp(tile).resize({ width: info.width, height: info.height, fit: "inside" }).png().toBuffer();
  const bannerIn = await sharp(banner).resize({ width: info.width }).png().toBuffer();
  const data = await sharp(base)
    .composite([
      { input: tileIn, tile: true, blend: "over" },
      { input: bannerIn, gravity: "south" },
    ])
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
  return { data, width: info.width, height: info.height };
}

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Throws when previews are off, today's cap or budget share is used up, or this IP had its previews today. */
export async function assertPreviewQuota(ip: string): Promise<void> {
  const e = env();
  if (e.FREE_PREVIEWS_PER_DAY <= 0) throw new AppError("Free previews are paused right now — you can order directly; one redo is included.", 503, "preview_off");
  const used = await prisma.aiRequest.count({ where: { purpose: "preview", createdAt: { gte: startOfUtcDay() } } });
  if (used >= e.FREE_PREVIEWS_PER_DAY) throw new AppError(QUOTA_MESSAGE, 429, "preview_quota");
  if (e.AI_DAILY_BUDGET_CENTS > 0 && (await todaysSpendMicros()) >= e.AI_DAILY_BUDGET_CENTS * 10_000 * PREVIEW_BUDGET_SHARE) {
    throw new AppError(QUOTA_MESSAGE, 429, "preview_quota");
  }
  try {
    await rateLimit({ key: `preview:${ip}`, limit: e.FREE_PREVIEWS_PER_IP, windowSeconds: 24 * 3600 });
  } catch (err) {
    if (err instanceof RateLimitedError) throw new AppError("You've had today's free previews — order now, or come back tomorrow for another.", 429, "preview_ip_limit");
    throw err;
  }
}

/** A preview may only use a fresh upload that no paid order owns (an abandoned checkout's upload is fine). */
async function assertPreviewUploads(fields: IntakeField[], intake: Record<string, unknown>): Promise<void> {
  const ids = fields
    .filter((f) => f.type === "image")
    .map((f) => intake[f.key])
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) return;
  const files = await prisma.file.findMany({ where: { id: { in: ids } }, select: { id: true, kind: true, expiresAt: true, order: { select: { status: true } } } });
  for (const id of ids) {
    const f = files.find((x) => x.id === id);
    const usable = f && f.kind === "INPUT" && (!f.expiresAt || f.expiresAt > new Date()) && (!f.order || ["PENDING", "CANCELED"].includes(f.order.status));
    if (!usable) throw new AppError("The uploaded photo could not be found — please upload it again.", 400, "upload_missing");
  }
}

export type PreviewResult = { image: string; width: number; height: number; caption: string };

export async function createPreview(input: { slug: string; intakeRaw: unknown; ip: string; sessionId?: string | null }): Promise<PreviewResult> {
  const def = getToolBySlug(input.slug);
  if (!def?.preview) throw new AppError("This tool has no free preview", 404, "no_preview");
  const tool = await prisma.tool.findUnique({ where: { id: def.id }, select: { status: true } });
  if (tool?.status !== "LIVE") throw new AppError("This tool is not accepting orders right now", 409, "tool_unavailable");

  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;
  await assertPreviewUploads(def.intake.fields, intake);
  await assertPreviewQuota(input.ip);

  const started = Date.now();
  try {
    const { image } = await def.preview.run({
      intake,
      // Always exactly one image, logged as purpose "preview" (that is what the daily cap counts).
      ai: { editImage: (call) => editImage({ ...call, n: 1, quality: call.quality ?? env().AI_PREVIEW_QUALITY }, { purpose: "preview", toolId: def.id }) },
    });
    const wm = await watermarkPreview(image);
    await track("preview_ready", { sessionId: input.sessionId, props: { tool: def.id, ms: Date.now() - started } });
    return { image: `data:image/jpeg;base64,${wm.data.toString("base64")}`, width: wm.width, height: wm.height, caption: def.preview.caption };
  } catch (err) {
    await track("preview_failed", { sessionId: input.sessionId, props: { tool: def.id, error: String((err as Error).message ?? err).slice(0, 200) } });
    if (err instanceof AppError && err.status < 500) throw err;
    throw new AppError("The preview could not be made right now — please try again in a minute, or order directly (one redo is included).", 502, "preview_failed");
  }
}
