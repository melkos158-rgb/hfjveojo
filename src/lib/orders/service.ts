import { prisma } from "@/lib/db";
import { adminEmails, appUrl, env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { getToolById } from "@/lib/tools/registry";
import { signedFileUrl } from "@/lib/storage";
import { track } from "@/lib/analytics/events";
import { AppError } from "@/lib/errors";
import { stripe } from "@/lib/stripe/client";
import { log } from "@/lib/logger";

export function orderUrl(order: { id: string; accessToken: string }): string {
  return appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`);
}

export async function notifyAdmins(subject: string, text: string): Promise<void> {
  for (const to of adminEmails()) {
    try {
      await sendEmail({ to, subject: `[${env().NEXT_PUBLIC_BRAND_NAME} admin] ${subject}`, text });
    } catch (err) {
      log.warn("notifyAdmins.failed", { to, error: (err as Error).message });
    }
  }
}

/** Mark an order delivered and email the customer their private order page + download links. */
export async function deliverOrder(orderId: string, opts: { by: "system" | "admin"; adminId?: string; deliveryLink?: string; note?: string }): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { outputs: { include: { file: true } } } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "COMPLETED") return;
  const def = getToolById(order.toolId);

  if (opts.deliveryLink) {
    await prisma.generatedOutput.create({
      data: { orderId, type: "LINK", title: "Your files", content: { url: opts.deliveryLink, note: opts.note ?? null } },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", deliveredAt: new Date(), qcStatus: opts.by === "admin" ? "APPROVED_BY_HUMAN" : order.qcStatus },
  });
  if (opts.adminId) {
    await prisma.adminAction.create({
      data: { adminId: opts.adminId, action: "deliver_order", targetType: "order", targetId: orderId, details: { deliveryLink: opts.deliveryLink ?? null } },
    });
  }

  const fileLinks = order.outputs
    .filter((o) => o.fileId)
    .map((o) => `${o.title}: ${signedFileUrl(o.fileId as string)}`);
  const link = orderUrl(order);
  const lines = [
    def?.delivery.emailIntro ?? "Your order is ready.",
    "",
    `Order page: ${link}`,
    ...(opts.deliveryLink ? [`Files: ${opts.deliveryLink}`] : []),
    ...fileLinks,
    "",
    "Reply to this email if anything is off — one revision round is included.",
    ...(def ? ["", `Next one? ${env().NEXT_PUBLIC_APP_URL}/tools/${def.slug} — same price, same speed.`] : []),
  ];
  await sendEmail({
    to: order.customerEmail,
    subject: def?.delivery.emailSubject ?? `Your ${env().NEXT_PUBLIC_BRAND_NAME} order #${order.number} is ready`,
    text: lines.join("\n"),
    html: `<p>${lines.map((l) => (l.startsWith("http") ? `<a href="${l}">${l}</a>` : l)).join("<br/>")}</p>`,
  });
  await track("order_delivered", { orderId, props: { tool: order.toolId, by: opts.by } });
}

/** Refund via Stripe (server-side) and record it. Requires an admin actor — high-impact action. */
export async function refundOrder(orderId: string, opts: { adminId: string; amountCents?: number; reason?: string }): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) throw new AppError("Order not found", 404);
  const payment = order.payments.find((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED");
  if (!payment || !payment.stripePaymentIntentId) throw new AppError("No refundable payment on this order", 400, "no_payment");
  const remaining = payment.amountCents - payment.amountRefundedCents;
  const amount = Math.min(opts.amountCents ?? remaining, remaining);
  if (amount <= 0) throw new AppError("Nothing left to refund", 400, "nothing_to_refund");

  const refund = await prisma.refund.create({
    data: { orderId, paymentId: payment.id, amountCents: amount, reason: opts.reason, createdById: opts.adminId },
  });
  try {
    const sr = await stripe().refunds.create(
      { payment_intent: payment.stripePaymentIntentId, amount, reason: "requested_by_customer", metadata: { orderId, refundId: refund.id } },
      { idempotencyKey: `refund_${refund.id}` },
    );
    await prisma.refund.update({ where: { id: refund.id }, data: { stripeRefundId: sr.id, status: "SUCCEEDED" } });
  } catch (err) {
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
    throw err;
  }
  const refundedTotal = payment.amountRefundedCents + amount;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { amountRefundedCents: refundedTotal, status: refundedTotal >= payment.amountCents ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });
  if (refundedTotal >= payment.amountCents) {
    await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  }
  await prisma.adminAction.create({
    data: { adminId: opts.adminId, action: "refund_order", targetType: "order", targetId: orderId, details: { amount, reason: opts.reason ?? null } },
  });
  await track("order_refunded", { orderId, props: { amountCents: amount } });
}

/** Admin: push a REVIEW/FAILED order back through the pipeline. */
export async function retryOrder(orderId: string, adminId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  if (!["REVIEW", "FAILED", "RETRYING", "PROCESSING"].includes(order.status)) {
    throw new AppError(`Cannot retry an order in status ${order.status}`, 400, "bad_state");
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "RETRYING", errorMessage: null, attempts: 0 } });
  await prisma.adminAction.create({ data: { adminId, action: "retry_order", targetType: "order", targetId: orderId } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId }, { orderId });
}
