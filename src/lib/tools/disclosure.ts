import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { randomToken } from "@/lib/security/tokens";

/**
 * Disclosure pack for digitally altered listing photos (virtual staging). California AB 723 (in force since
 * 2026-01-01) and most MLS boards want altered photos labeled ("virtually staged" / "digitally altered") and the
 * unaltered original available next to them — on the agent's own site, or through a public link / QR code elsewhere.
 * Each staging order therefore gets: labeled copies, a public page with the original photo, a QR code to it and a
 * ready-to-paste disclosure line. Not legal advice; the agent stays responsible for their listing.
 */

export const LABEL_TEXT = "Virtually staged";

/** Output variant for labeled copies — kept out of the main before/after grid. */
export const LABELED_VARIANT = "labeled";

export function isLabeledOutput(o: { content: unknown }): boolean {
  return ((o.content ?? {}) as { variant?: string }).variant === LABELED_VARIANT;
}

let labelPng: Buffer | null = null;

/**
 * Put the "Virtually staged" label in the bottom-left corner (about a fifth of the photo width). The label is a
 * pre-rendered PNG (public/brand/label-virtually-staged.png), so the server needs no fonts.
 */
export async function labelStagedPhoto(jpeg: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  labelPng ??= await readFile(join(process.cwd(), "public", "brand", "label-virtually-staged.png"));
  const meta = await sharp(jpeg).metadata();
  const width = meta.width ?? 1536;
  const height = meta.height ?? 1024;
  const labelWidth = Math.max(160, Math.min(420, Math.round(width * 0.2)));
  const label = await sharp(labelPng).resize({ width: labelWidth }).png().toBuffer();
  const labelHeight = (await sharp(label).metadata()).height ?? Math.round(labelWidth / 5.6);
  const margin = Math.max(12, Math.round(width * 0.025));
  return sharp(jpeg)
    .composite([{ input: label, left: margin, top: Math.max(0, height - labelHeight - margin) }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export function originalPhotoUrl(publicToken: string): string {
  return appUrl(`/original/${publicToken}`);
}

export function disclosureLine(publicToken: string): string {
  return `Virtually staged (digitally altered image). Original photo: ${originalPhotoUrl(publicToken)}`;
}

/** The order's public token, created on first use (orders from before the disclosure pack have none). */
export async function ensurePublicToken(orderId: string): Promise<string> {
  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { publicToken: true } });
  if (current?.publicToken) return current.publicToken;
  const token = randomToken(12);
  await prisma.order.updateMany({ where: { id: orderId, publicToken: null }, data: { publicToken: token } });
  const after = await prisma.order.findUnique({ where: { id: orderId }, select: { publicToken: true } });
  return after?.publicToken ?? token;
}

export async function qrPng(url: string): Promise<Buffer> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toBuffer(url, { type: "png", width: 600, margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
}
