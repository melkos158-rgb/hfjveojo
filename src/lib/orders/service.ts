import { prisma } from "@/lib/db";
import { adminEmails, appUrl, env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { getToolById } from "@/lib/tools/registry";
import { signedFileUrl } from "@/lib/storage";
import { track } from "@/lib/analytics/events";
import { AppError } from "@/lib/errors";
import { stripe } from "@/lib/stripe/client";
import { log } from "@/lib/logger";
import { outputsToDeliver } from "@/lib/orders/deliverables";
import { abandonRuns, liveRunOf } from "@/lib/orders/runs";
import { linkify } from "@/lib/email/layout";

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


/**
 * Mark an order delivered and email the customer their private order page + download links.
 * Delivers the newest run's outputs (see outputsToDeliver) and stamps them `deliveredAt`, so the order page shows
 * exactly what was sent. A second delivery of the same order is a redo: the email says so and the new files
 * replace the old ones on the page; `Order.deliveredAt` keeps the first delivery (SLA metrics).
 */
export async function deliverOrder(orderId: string, opts: { by: "system" | "admin"; adminId?: string; deliveryLink?: string; note?: string }): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { outputs: true } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "COMPLETED") return;
  const def = getToolById(order.toolId);
  const note = opts.note?.trim() || undefined;

  let outputs = order.outputs;
  if (opts.deliveryLink) {
    const linkOut = await prisma.generatedOutput.create({
      data: { orderId, type: "LINK", title: "Your files", content: { url: opts.deliveryLink, note: note ?? null } },
    });
    outputs = [...outputs, linkOut];
  }
  const toDeliver = outputsToDeliver(outputs);
  const redo = order.deliveredAt !== null;
  const now = new Date();

  await prisma.$transaction([
    prisma.generatedOutput.updateMany({ where: { id: { in: toDeliver.map((o) => o.id) } }, data: { deliveredAt: now } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED", deliveredAt: order.deliveredAt ?? now, qcStatus: opts.by === "admin" ? "APPROVED_BY_HUMAN" : order.qcStatus },
    }),
  ]);
  if (opts.adminId) {
    await prisma.adminAction.create({
      data: { adminId: opts.adminId, action: "deliver_order", targetType: "order", targetId: orderId, details: { deliveryLink: opts.deliveryLink ?? null, redo } },
    });
  }

  const fileLinks = toDeliver.filter((o) => o.fileId).map((o) => `${o.title}: ${signedFileUrl(o.fileId as string)}`);
  const link = orderUrl(order);
  const brand = env().NEXT_PUBLIC_BRAND_NAME;
  const lines = [
    redo ? "Here is the new version of your order. It replaces the earlier files on your order page." : (def?.delivery.emailIntro ?? "Your order is ready."),
    ...(note ? ["", note] : []),
    "",
    `Order page: ${link}`,
    ...(opts.deliveryLink ? [`Files: ${opts.deliveryLink}`] : []),
    ...fileLinks,
    "",
    redo ? "Reply to this email if anything is still off." : "Reply to this email if anything is off — one revision round is included.",
    ...(def ? ["", `Next one? ${env().NEXT_PUBLIC_APP_URL}/tools/${def.slug} — same price, same speed.`] : []),
  ];
  await sendEmail({
    to: order.customerEmail,
    subject: redo ? `Your redo is ready — ${brand} order #${order.number}` : (def?.delivery.emailSubject ?? `Your ${brand} order #${order.number} is ready`),
    text: lines.join("\n"),
    html: `<p>${lines.map(linkify).join("<br/>")}</p>`,
  });
  await track(redo ? "order_redelivered" : "order_delivered", { orderId, props: { tool: order.toolId, by: opts.by } });
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
    // The refund goes to the account that took the money: the order's own mode, whatever checkouts use today.
    const sr = await stripe(order.livemode ? "live" : "test").refunds.create(
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
  if (order.status === "PROCESSING") {
    // Only an abandoned run may be replaced: a second run next to a live one would pay the AI twice.
    const live = await liveRunOf(orderId);
    if (live) {
      const secs = Math.max(0, Math.round((Date.now() - live.lastBeatAt.getTime()) / 1000));
      throw new AppError(`The pipeline is still working on this order (last heartbeat ${secs}s ago) — wait for it to finish.`, 409, "busy");
    }
    await abandonRuns(orderId, "abandoned: admin retry after the run stopped reporting");
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "RETRYING", errorMessage: null, attempts: 0 } });
  await prisma.adminAction.create({ data: { adminId, action: "retry_order", targetType: "order", targetId: orderId } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId }, { orderId });
}

/**
 * Admin: the free redo promised on delivered orders ("one redo included"). Runs the pipeline again on the same
 * intake; AUTO tools re-deliver on their own (email: "Your redo is ready"), concierge tools park in REVIEW as usual.
 * The customer keeps seeing the files of the last delivery until the new ones are delivered.
 */
export async function redoOrder(orderId: string, adminId: string, reason?: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "COMPLETED") throw new AppError(`Only a delivered order can be redone (status ${order.status})`, 400, "bad_state");
  const def = getToolById(order.toolId);
  if (!def) throw new AppError("Tool is not registered", 400, "unknown_tool");
  const redosBefore = await prisma.adminAction.count({ where: { action: "redo_order", targetType: "order", targetId: orderId } });
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "RETRYING", errorMessage: null, attempts: 0, qcStatus: "NOT_RUN", qcNotes: null, dueAt: new Date(Date.now() + def.sla.deliveryHours * 3600 * 1000) },
  });
  await prisma.adminAction.create({
    data: { adminId, action: "redo_order", targetType: "order", targetId: orderId, details: { reason: reason?.trim() || null, redoNumber: redosBefore + 1 } },
  });
  await track("order_redo", { orderId, props: { tool: order.toolId, redoNumber: redosBefore + 1 } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId }, { orderId });
}
