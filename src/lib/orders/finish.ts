import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { signPayload, verifyPayload } from "@/lib/security/tokens";
import { STAGING_FINISH_DAYS } from "@/config/staging-pricing";
import { isFreePhotoOrder } from "@/lib/orders/voucher";

/**
 * "Finish this listing" (court ruling of 2026-10-06): after a free first photo is delivered, the person may stage the
 * rest of that listing at the finish price (src/config/staging-pricing.ts STAGING_FINISH_PACK) for 7 days. The offer
 * travels as a signed link in the free photo's delivery email and on its order page; the order form shows the price
 * and the server checks the link again before pricing (src/lib/orders/create.ts).
 */
export const FINISH_TOOL_SLUG = "virtual-staging";
const DAY = 24 * 3600 * 1000;

/** When the offer of a delivered free photo ends. */
export function finishEndsAt(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + STAGING_FINISH_DAYS * DAY);
}

/** The finish link for a delivered free photo, or null once the 7 days are over. */
export function finishUrl(freeOrderId: string, deliveredAt: Date | null, now = new Date()): string | null {
  if (!deliveredAt) return null;
  const left = Math.floor((finishEndsAt(deliveredAt).getTime() - now.getTime()) / 1000);
  if (left < 60) return null;
  const t = signPayload({ o: freeOrderId, k: "finish" }, left);
  return appUrl(`/tools/${FINISH_TOOL_SLUG}?finish=${encodeURIComponent(t)}#order`);
}

export type FinishCheck = { ok: true; freeOrderId: string; style: string | null; email: string } | { ok: false };

/** A finish link is good while it is unexpired and points at a delivered free first photo. */
export async function checkFinish(token: string | null | undefined): Promise<FinishCheck> {
  if (!token) return { ok: false };
  const payload = verifyPayload<{ o: string; k: string }>(token);
  if (!payload || payload.k !== "finish" || typeof payload.o !== "string") return { ok: false };
  const order = await prisma.order.findUnique({ where: { id: payload.o }, select: { id: true, free: true, freeKey: true, toolId: true, status: true, deliveredAt: true, intake: true, customerEmail: true } });
  if (!order || order.toolId !== FINISH_TOOL_SLUG || !isFreePhotoOrder(order) || order.status !== "COMPLETED" || !order.deliveredAt) return { ok: false };
  if (finishEndsAt(order.deliveredAt).getTime() < Date.now()) return { ok: false };
  const style = (order.intake as { style?: unknown } | null)?.style;
  return { ok: true, freeOrderId: order.id, style: typeof style === "string" ? style : null, email: order.customerEmail };
}
