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
import { formatUsd } from "@/lib/ai/pricing";
import { descriptionVoucherUrl, isCreditOrder, isFreePhotoOrder, orderHasVoucher } from "@/lib/orders/voucher";
import { creditBalance, CREDIT_TOOL_SLUG, CREDIT_USE_TOOL_SLUG, CREDITS_PER_PACK } from "@/lib/orders/credits";
import { finishUrl } from "@/lib/orders/finish";
import { STAGING_FINISH_PACK } from "@/config/staging-pricing";

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
  const intro = redo
    ? "Here is the new version of your order. It replaces the earlier files on your order page."
    : isFreePhotoOrder(order)
      ? "Here is your free staged photo: two versions of your room at full resolution, plus copies labeled “Virtually staged” for the MLS."
      : (def?.delivery.emailIntro ?? "Your order is ready.");
  // The Listing Pack (or the $7 add-on) includes the MLS description: a voucher link to write it.
  const voucher = !redo && orderHasVoucher(order) ? descriptionVoucherUrl(order.id) : null;
  // Orders paid with Pro credits say what is left; the staging form shows the same balance once signed in.
  const credit = isCreditOrder(order);
  const balance = !redo && credit ? await creditBalance(order.customerEmail) : null;
  const creditLine = balance
    ? `Paid with Pro credits: ${order.quantity} room${order.quantity === 1 ? "" : "s"} used, ${balance.rooms} left${balance.validUntil && balance.rooms > 0 ? ` (valid until ${balance.validUntil.toISOString().slice(0, 10)})` : ""}.`
    : null;
  const app = env().NEXT_PUBLIC_APP_URL;
  const stageWithCredits = `${app}/login?next=${encodeURIComponent(`/tools/${CREDIT_USE_TOOL_SLUG}#order`)}`;
  const lines = [
    intro,
    ...(creditLine ? ["", creditLine] : []),
    ...(note ? ["", note] : []),
    "",
    `Order page: ${link}`,
    ...(opts.deliveryLink ? [`Files: ${opts.deliveryLink}`] : []),
    ...fileLinks,
    ...(voucher ? ["", `Your MLS listing description is included. Enter the listing facts here (about 2 minutes) and it's written for you: ${voucher}`] : []),
    "",
    redo
      ? "Reply to this email if anything is still off."
      : order.toolId === CREDIT_TOOL_SLUG
        ? "Reply to this email with any question about your credits."
        : "Reply to this email if anything is off — one revision round is included.",
    ...(def
      ? [
          "",
          order.toolId === CREDIT_TOOL_SLUG
            ? `Stage your first photos (sign in with this email): ${stageWithCredits}`
            : credit
            ? `Next listing? Sign in and the staging form uses your credits: ${stageWithCredits}`
            : isFreePhotoOrder(order) && def.freeFirstPhoto && def.pricing.pack
            ? `Finish this listing: up to ${STAGING_FINISH_PACK.units} more rooms + ${def.pricing.packIncludes ?? "extras"} for ${formatUsd(STAGING_FINISH_PACK.cents)} (the offer runs 7 days) — ${finishUrl(order.id, order.deliveredAt ?? now) ?? `${env().NEXT_PUBLIC_APP_URL}/tools/${def.slug}`}`
            : isFreePhotoOrder(order)
            ? `Stage the rest of the listing: ${formatUsd(def.pricing.priceCents)} a room — ${env().NEXT_PUBLIC_APP_URL}/tools/${def.slug}`
            : `Next one? ${env().NEXT_PUBLIC_APP_URL}/tools/${def.slug} — same price, same speed.`,
          // Paid staging orders: the prepaid option for people who stage every week (court ruling 2026-10-06, lever 3).
          ...(!redo && !order.free && def.slug === CREDIT_USE_TOOL_SLUG
            ? [`Stage every week? ${CREDITS_PER_PACK} rooms for ${formatUsd(getToolById(CREDIT_TOOL_SLUG)?.pricing.priceCents ?? 14900).replace(/\.00$/, "")} with Pro credits, no subscription: ${app}/tools/${CREDIT_TOOL_SLUG}`]
            : []),
        ]
      : []),
  ];
  await sendEmail({
    to: order.customerEmail,
    subject: redo
      ? `Your redo is ready — ${brand} order #${order.number}`
      : isFreePhotoOrder(order)
        ? "Your free staged photo is ready"
        : (def?.delivery.emailSubject ?? `Your ${brand} order #${order.number} is ready`),
    text: lines.join("\n"),
    html: `<p>${lines.map(linkify).join("<br/>")}</p>`,
  });
  await track(redo ? "order_redelivered" : "order_delivered", { orderId, props: { tool: order.toolId, by: opts.by } });
}

/** Refund via Stripe (server-side) and record it. Requires an admin actor — high-impact action. */
export async function refundOrder(orderId: string, opts: { adminId: string; amountCents?: number; reason?: string }): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) throw new AppError("Order not found", 404);
  if (isCreditOrder(order)) {
    // Paid with Pro credits: no money moved, so the refund puts the order's rooms back on the balance.
    if (["REFUNDED", "CANCELED"].includes(order.status)) throw new AppError("This order's rooms are already back on the balance", 400, "nothing_to_refund");
    await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
    await prisma.adminAction.create({
      data: { adminId: opts.adminId, action: "return_credits", targetType: "order", targetId: orderId, details: { rooms: order.quantity, reason: opts.reason ?? null } },
    });
    await track("credits_returned", { orderId, props: { rooms: order.quantity } });
    return;
  }
  const payment = order.payments.find((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED");
  // Orders paid on a marketplace (Fiverr, Upwork…) are refunded there; here the refund is only recorded.
  const external = payment && !payment.stripePaymentIntentId ? ((payment.raw ?? {}) as { provider?: string }).provider : undefined;
  if (!payment || (!payment.stripePaymentIntentId && !external)) throw new AppError("No refundable payment on this order", 400, "no_payment");
  const remaining = payment.amountCents - payment.amountRefundedCents;
  const amount = Math.min(opts.amountCents ?? remaining, remaining);
  if (amount <= 0) throw new AppError("Nothing left to refund", 400, "nothing_to_refund");

  const refund = await prisma.refund.create({
    data: { orderId, paymentId: payment.id, amountCents: amount, reason: opts.reason ?? (external ? `refunded on ${external}` : undefined), createdById: opts.adminId, ...(external ? { status: "SUCCEEDED" as const } : {}) },
  });
  if (!external) try {
    // The refund goes to the account that took the money: the order's own mode, whatever checkouts use today.
    const sr = await stripe(order.livemode ? "live" : "test").refunds.create(
      { payment_intent: payment.stripePaymentIntentId ?? undefined, amount, reason: "requested_by_customer", metadata: { orderId, refundId: refund.id } },
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
