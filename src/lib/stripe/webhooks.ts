import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { stripe } from "@/lib/stripe/client";
import { enqueue } from "@/lib/jobs/queue";
import { upsertUserByEmail } from "@/lib/auth/magic";
import { track } from "@/lib/analytics/events";
import { notifyAdmins, orderUrl } from "@/lib/orders/service";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getToolById } from "@/lib/tools/registry";

/**
 * Stripe is the source of truth for payment state. The frontend never marks anything paid.
 * Every event is recorded in StripeEvent first (idempotency) and processed at most once.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<{ handled: boolean; duplicate: boolean }> {
  const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing?.processedAt) return { handled: true, duplicate: true };
  if (!existing) {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type, payload: event as unknown as object } });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") await onCheckoutPaid(session);
        else log.info("stripe.checkout_not_paid_yet", { sessionId: session.id, status: session.payment_status });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await onCheckoutFailed(session, event.type);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (orderId) await track("payment_failed", { orderId, props: { reason: pi.last_payment_error?.message ?? null } });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await onChargeRefunded(charge);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await notifyAdmins("Stripe dispute opened", `Charge ${dispute.charge as string}, amount ${dispute.amount}. Respond in the Stripe dashboard.`);
        break;
      }
      default:
        log.debug("stripe.ignored_event", { type: event.type });
    }
    await prisma.stripeEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return { handled: true, duplicate: false };
  } catch (err) {
    await prisma.stripeEvent.update({ where: { id: event.id }, data: { error: String((err as Error).message).slice(0, 1000) } });
    throw err;
  }
}

async function onCheckoutPaid(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id ?? null;
  if (!orderId) {
    log.warn("stripe.paid_without_order", { sessionId: session.id });
    return;
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    log.warn("stripe.paid_unknown_order", { orderId, sessionId: session.id });
    return;
  }
  if (order.status !== "PENDING") {
    log.info("stripe.paid_already_processed", { orderId, status: order.status });
    return;
  }

  // Server-side amount check: what Stripe charged must equal what we priced.
  const paid = session.amount_total ?? 0;
  if (paid !== order.amountCents) {
    await notifyAdmins(`Amount mismatch on order #${order.number}`, `Expected ${order.amountCents}, Stripe charged ${paid}. Session ${session.id}.`);
  }

  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  let chargeId: string | null = null;
  let receiptUrl: string | null = null;
  if (piId) {
    try {
      const pi = await stripe().paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
      const charge = pi.latest_charge as Stripe.Charge | null;
      chargeId = charge?.id ?? null;
      receiptUrl = charge?.receipt_url ?? null;
    } catch (err) {
      log.warn("stripe.pi_retrieve_failed", { piId, error: (err as Error).message });
    }
  }

  const email = (session.customer_details?.email ?? session.customer_email ?? order.customerEmail).toLowerCase();
  const user = await upsertUserByEmail(email, session.customer_details?.name ?? order.customerName);
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  if (stripeCustomerId && !user.stripeCustomerId) {
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } }).catch(() => undefined);
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: paid,
        currency: session.currency ?? order.currency,
        status: "SUCCEEDED",
        receiptUrl,
        raw: { sessionId: session.id } as object,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date(), userId: user.id, customerEmail: email, stripePaymentIntentId: piId ?? undefined },
    }),
  ]);

  await track("order_paid", { orderId, userId: user.id, experimentId: order.experimentId, props: { amountCents: paid, tool: order.toolId } });

  const def = getToolById(order.toolId);
  const link = orderUrl(order);
  await sendEmail({
    to: email,
    subject: `Order #${order.number} confirmed — ${def?.name ?? env().NEXT_PUBLIC_BRAND_NAME}`,
    text: [
      `Thanks — your payment went through.`,
      def ? `${def.landing.deliveryPromise}` : "",
      "",
      `Track your order here: ${link}`,
      receiptUrl ? `Receipt: ${receiptUrl}` : "",
      "",
      "Reply to this email if you need anything.",
    ]
      .filter((l) => l !== undefined)
      .join("\n"),
  });

  await enqueue("fulfill_order", { orderId }, { orderId, defer: true });
}

async function onCheckoutFailed(session: Stripe.Checkout.Session, type: string): Promise<void> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id ?? null;
  if (!orderId) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return;
  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELED", errorMessage: type } });
  await track("checkout_abandoned", { orderId, props: { type } });
}

async function onChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ stripeChargeId: charge.id }, { stripePaymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? "" }] },
  });
  if (!payment) return;
  const refunded = charge.amount_refunded ?? 0;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { amountRefundedCents: refunded, status: refunded >= payment.amountCents ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });
  if (refunded >= payment.amountCents) {
    await prisma.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED" } });
    await track("order_refunded", { orderId: payment.orderId, props: { amountCents: refunded, source: "stripe_dashboard" } });
  }
}
