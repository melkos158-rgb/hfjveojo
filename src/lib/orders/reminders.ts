import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { track } from "@/lib/analytics/events";
import { formatUsd } from "@/lib/ai/pricing";
import { log } from "@/lib/logger";
import { RESUME_HOURS } from "@/lib/orders/create";

/**
 * One reminder for an unpaid order (court ruling of 2026-10-06, lever 1): about 2 hours after a checkout was left, the
 * customer gets a single email with a link that re-opens the same order (src/lib/orders/create.ts resumeCheckout). Never
 * a second one, never for free photos, test orders or orders someone already paid or re-ordered.
 */
export const REMINDER_AFTER_HOURS = 2;
const REMINDER_EVENT = "checkout_reminder_sent";

export async function sendCheckoutReminders(now = new Date()): Promise<number> {
  const from = new Date(now.getTime() - (RESUME_HOURS - 4) * 3600_000);
  const to = new Date(now.getTime() - REMINDER_AFTER_HOURS * 3600_000);
  const candidates = await prisma.order.findMany({
    where: {
      free: false,
      isTest: false,
      createdAt: { gte: from, lte: to },
      checkoutCompletedAt: null,
      paidAt: null,
      OR: [{ status: "CANCELED", errorMessage: "checkout.session.expired" }, { status: "PENDING" }],
    },
    include: { tool: true },
    take: 20,
  });
  let sent = 0;
  for (const order of candidates) {
    if (await prisma.event.findFirst({ where: { name: REMINDER_EVENT, orderId: order.id }, select: { id: true } })) continue;
    // The same person paid for another order since: no reminder.
    const paidSince = await prisma.order.findFirst({ where: { customerEmail: order.customerEmail, paidAt: { gte: order.createdAt }, free: false }, select: { id: true } });
    if (paidSince) continue;
    const resume = appUrl(`/api/orders/${order.id}/resume?t=${encodeURIComponent(order.accessToken)}`);
    const what = order.quantity > 1 ? `${order.quantity} photos, ${formatUsd(order.amountCents)}` : formatUsd(order.amountCents);
    const lines = [
      `You started an order for ${order.tool.name} (${what}) but didn't finish the checkout.`,
      "",
      `Your photos and choices are saved for a little longer. Finish the same order here: ${resume}`,
      "",
      "Changed your mind? Ignore this email: nothing was charged, and this is the only reminder.",
    ];
    await track(REMINDER_EVENT, { orderId: order.id, props: { tool: order.toolId } }); // first, so a crash never sends twice
    try {
      await sendEmail({ to: order.customerEmail, subject: "Your order is saved — finish it in one click", text: lines.join("\n") });
      sent++;
    } catch (err) {
      log.warn("orders.reminder_failed", { orderId: order.id, error: (err as Error).message });
    }
  }
  return sent;
}
