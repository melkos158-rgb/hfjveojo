import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appUrl, env } from "@/lib/env";
import { AppError, RateLimitedError } from "@/lib/errors";
import { getToolById, getToolBySlug } from "@/lib/tools/registry";
import { photoInputsOf, quantityOf } from "@/lib/tools/photos";
import type { ToolDefinition } from "@/lib/tools/types";
import { randomToken, sha256, signPayload, verifyPayload } from "@/lib/security/tokens";
import { hashIp, rateLimit } from "@/lib/security/ratelimit";
import { normalizeEmail, upsertUserByEmail } from "@/lib/auth/magic";
import { track, type Attribution } from "@/lib/analytics/events";
import { todaysSpendMicros } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { textToHtml } from "@/lib/email/layout";
import { log } from "@/lib/logger";

/**
 * Free first photo (virtual staging): one photo per person, full resolution and without a watermark — the same order a
 * customer pays $15 for. The visitor uploads the photo and leaves an email; the order is created PENDING and nothing
 * runs until they click the link we email them. The click proves the address is theirs (it is also how we reach them
 * again) and keeps bots from spending AI money.
 *
 * Guards: one claimed free photo per person (unique Order.freeKey, see freeKeyOf); FREE_PHOTOS_PER_IP requests per IP
 * and FREE_REQUESTS_PER_EMAIL per person a day; FREE_PHOTOS_PER_DAY claimed a day; none once today's AI spend reaches
 * FREE_PHOTO_BUDGET_SHARE of the daily AI budget, so paid orders always keep the rest. No throwaway inboxes.
 * Free orders carry `free: true` and amount 0: they are excluded from revenue, paid-order counts and ad conversions.
 */

/** New free photos stop once today's AI spend reaches this share of AI_DAILY_BUDGET_CENTS. */
export const FREE_PHOTO_BUDGET_SHARE = 0.5;
/** The emailed link works this long; a claim after a sold-out day works the next day. */
export const FREE_CLAIM_TTL_SECONDS = 7 * 24 * 3600;
export const FREE_REQUESTS_PER_EMAIL = 3;

/** Throwaway inbox services: nobody there is a customer, and they would let one person claim many free photos. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
  "emailondeck.com",
  "mohmal.com",
  "burnermail.io",
  "mailnesia.com",
]);

/**
 * The person behind an email, for the one-free-photo rule: lower-case with any "+tag" removed; for Gmail also without
 * dots, and googlemail.com counts as gmail.com (Gmail delivers all of those spellings to the same inbox).
 */
export function freeKeyOf(emailRaw: string): string {
  const email = normalizeEmail(emailRaw);
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  let local = email.slice(0, at).split("+")[0];
  let domain = email.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

export function isDisposableEmail(email: string): boolean {
  const domain = normalizeEmail(email).split("@")[1] ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export type FreePhotoAvailability = { available: boolean; reason?: "off" | "sold_out" };

/** Whether a free photo can be requested or claimed right now; the tool page shows the offer only then. */
export async function freePhotoAvailability(): Promise<FreePhotoAvailability> {
  const e = env();
  if (e.FREE_PHOTOS_PER_DAY <= 0) return { available: false, reason: "off" };
  const claimedToday = await prisma.order.count({ where: { free: true, paidAt: { gte: startOfUtcDay() } } });
  if (claimedToday >= e.FREE_PHOTOS_PER_DAY) return { available: false, reason: "sold_out" };
  if (e.AI_DAILY_BUDGET_CENTS > 0 && (await todaysSpendMicros()) >= e.AI_DAILY_BUDGET_CENTS * 10_000 * FREE_PHOTO_BUDGET_SHARE) {
    return { available: false, reason: "sold_out" };
  }
  return { available: true };
}

/** The link in the confirmation email. Signed, so only the order it was issued for can be claimed with it. */
export function freeClaimUrl(orderId: string): string {
  const t = signPayload({ o: orderId, k: "free" }, FREE_CLAIM_TTL_SECONDS);
  return appUrl(`/api/free/claim?o=${encodeURIComponent(orderId)}&t=${encodeURIComponent(t)}`);
}

const SOLD_OUT_MESSAGE = "Today's free photos are gone. Come back tomorrow, see a free watermarked preview now, or order directly.";

export type FreePhotoRequest = {
  toolSlug: string;
  email: string;
  intakeRaw: unknown;
  /** The visitor's IP, only ever used as a keyed hash for the per-IP limit. */
  ip: string;
  attribution?: Attribution | null;
  userId?: string | null;
  sessionId?: string | null;
  /** The owner's/operator's own device: no funnel event. */
  internal?: boolean;
};

/** Form → PENDING free order + confirmation email. Nothing is staged until the link in the email is clicked. */
export async function requestFreePhoto(input: FreePhotoRequest): Promise<{ orderId: string; email: string }> {
  const def = getToolBySlug(input.toolSlug);
  if (!def?.freeFirstPhoto) throw new AppError("This tool has no free photo", 404, "no_free_photo");
  const tool = await prisma.tool.findUnique({ where: { id: def.id }, select: { status: true } });
  if (tool?.status !== "LIVE") throw new AppError("This tool is not accepting orders right now", 409, "tool_unavailable");
  const product = await prisma.product.findFirst({ where: { toolId: def.id, active: true, type: "ONE_TIME" } });
  if (!product) throw new AppError("No active price for this tool", 409, "no_product");

  const parsedEmail = z.email().safeParse(normalizeEmail(input.email));
  if (!parsedEmail.success) throw new AppError("Enter a valid email — the link to your free photo goes there.", 400, "invalid_email");
  const email = parsedEmail.data;
  if (isDisposableEmail(email)) throw new AppError("Please use your regular email — throwaway inboxes can't get the free photo.", 400, "disposable_email");

  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;
  const tdef = def as ToolDefinition<unknown>;
  if (quantityOf(tdef, intake) !== 1) {
    throw new AppError("The free photo is one photo. Keep one photo in the form, or order them all at $15 each.", 400, "free_one_photo");
  }

  const key = freeKeyOf(email);
  const used = await prisma.order.findUnique({ where: { freeKey: key }, select: { id: true } });
  if (used) throw new AppError("This email has already had its free photo. The next ones are $15 each.", 409, "free_used");

  const availability = await freePhotoAvailability();
  if (!availability.available) {
    throw new AppError(
      availability.reason === "off" ? "Free photos are paused right now — you can still see a free watermarked preview, or order directly." : SOLD_OUT_MESSAGE,
      429,
      "free_sold_out",
    );
  }

  try {
    await rateLimit({ key: `free:${hashIp(input.ip)}`, limit: env().FREE_PHOTOS_PER_IP, windowSeconds: 24 * 3600 });
    await rateLimit({ key: `free:email:${sha256(key)}`, limit: FREE_REQUESTS_PER_EMAIL, windowSeconds: 24 * 3600 });
  } catch (err) {
    if (err instanceof RateLimitedError) throw new AppError("That's enough free-photo requests for today — the link we sent is in your inbox.", 429, "free_rate_limited");
    throw err;
  }

  // Same rule as a paid order: a fresh upload no other order owns (an abandoned checkout of the same person is fine).
  const fileIds = [...new Set(photoInputsOf(tdef, intake).map((p) => p.fileId))];
  if (fileIds.length > 0) {
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, kind: true, orderId: true, userId: true, expiresAt: true, order: { select: { status: true, customerEmail: true } } },
    });
    for (const id of fileIds) {
      const f = files.find((x) => x.id === id);
      const reusable = !f?.orderId || (f.order && ["PENDING", "CANCELED"].includes(f.order.status) && f.order.customerEmail === email);
      const ok = f && f.kind === "INPUT" && reusable && (!f.expiresAt || f.expiresAt > new Date()) && (!f.userId || !input.userId || f.userId === input.userId);
      if (!ok) throw new AppError("The uploaded photo could not be found — please upload it again.", 400, "upload_missing");
    }
  }

  // A newer request replaces an unconfirmed older one of the same address.
  await prisma.order.updateMany({ where: { free: true, status: "PENDING", customerEmail: email }, data: { status: "CANCELED", errorMessage: "free photo: replaced by a newer request" } });

  const now = new Date();
  const order = await prisma.order.create({
    data: {
      free: true,
      isTest: false,
      livemode: false,
      publicToken: def.disclosurePack ? randomToken(12) : undefined,
      userId: input.userId ?? undefined,
      customerEmail: email,
      toolId: def.id,
      toolVersion: def.version,
      productId: product.id,
      status: "PENDING",
      intake: intake as object,
      amountCents: 0,
      quantity: 1,
      currency: product.currency,
      accessToken: randomToken(24),
      attribution: (input.attribution as object) ?? undefined,
      adminNotes: "Free first photo: staged once the customer clicks the link in the confirmation email.",
    },
  });
  if (fileIds.length > 0) {
    // Unconfirmed: the upload lives as long as any upload; a claim extends it to the output retention.
    await prisma.file.updateMany({ where: { id: { in: fileIds } }, data: { orderId: order.id, expiresAt: new Date(now.getTime() + env().FILE_RETENTION_DAYS_INPUT * 24 * 3600 * 1000) } });
  }

  const url = freeClaimUrl(order.id);
  const text = [
    "Hi,",
    "",
    "Click this link to confirm your email, and we'll stage your photo right away (about 2 minutes):",
    url,
    "",
    "You get two staged versions of your room as full-resolution JPGs, plus copies labeled “Virtually staged” for the MLS. The link works for 7 days.",
    "",
    "One free photo per person. After that, it's $15 per photo.",
    "",
    "Didn't ask for this? Ignore this email and nothing happens.",
  ].join("\n");
  try {
    await sendEmail({ to: email, subject: "Confirm your email to get your free staged photo", text, html: textToHtml(text) });
  } catch (err) {
    log.warn("free_photo.email_failed", { orderId: order.id, error: (err as Error).message });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELED", errorMessage: "free photo: confirmation email failed" } });
    throw new AppError("We couldn't send the email right now. Please try again in a few minutes.", 503, "email_unavailable");
  }
  if (!input.internal) {
    await track("free_photo_requested", { orderId: order.id, sessionId: input.sessionId ?? undefined, userId: input.userId ?? undefined, props: { tool: def.id } });
  }
  return { orderId: order.id, email };
}

export type FreeClaimOutcome = "claimed" | "already" | "used" | "canceled" | "sold_out" | "invalid";

/**
 * The emailed link was clicked: the address is confirmed, so the order becomes PAID (for $0) and runs through the
 * normal pipeline. Safe to click twice: the second click finds the order already claimed. When the person already had
 * a free photo, the unique freeKey refuses the second one and the order is closed.
 */
export async function claimFreePhoto(orderId: string, token: string): Promise<{ outcome: FreeClaimOutcome; order?: { id: string; accessToken: string } }> {
  const payload = verifyPayload<{ o: string; k: string }>(token);
  if (!payload || payload.k !== "free" || payload.o !== orderId) return { outcome: "invalid" };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.free) return { outcome: "invalid" };
  const ref = { id: order.id, accessToken: order.accessToken };
  if (order.status === "CANCELED" || order.status === "REFUNDED") {
    return { outcome: (order.errorMessage ?? "").startsWith("free photo: already used") ? "used" : "canceled", order: ref };
  }
  if (order.status !== "PENDING") return { outcome: "already", order: ref };

  const availability = await freePhotoAvailability();
  if (!availability.available) return { outcome: "sold_out", order: ref };

  const def = getToolById(order.toolId);
  const user = await upsertUserByEmail(order.customerEmail);
  const now = new Date();
  try {
    const res = await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING", free: true },
      data: {
        status: "PAID",
        paidAt: now,
        freeKey: freeKeyOf(order.customerEmail),
        userId: user.id,
        dueAt: new Date(now.getTime() + (def?.sla.deliveryHours ?? 1) * 3600 * 1000),
      },
    });
    if (res.count === 0) return { outcome: "already", order: ref }; // a second click won the race
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      await prisma.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "CANCELED", errorMessage: "free photo: already used by this person" } });
      return { outcome: "used", order: ref };
    }
    throw err;
  }
  await prisma.file.updateMany({
    where: { orderId: order.id, kind: "INPUT" },
    data: { expiresAt: new Date(now.getTime() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) },
  });
  await track("free_photo_claimed", { orderId: order.id, userId: user.id, props: { tool: order.toolId } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId: order.id }, { orderId: order.id });
  return { outcome: "claimed", order: ref };
}
