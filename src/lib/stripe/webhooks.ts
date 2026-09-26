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
import { checkoutMode, type StripeMode } from "@/lib/stripe/mode";

/**
 * Stripe is the source of truth for payment state. The frontend never marks anything paid.
 * Every event is recorded in StripeEvent first (idempotency) and processed at most once; the order's status change
 * itself is a conditional update, so even two different events for one session cannot fulfil an order twice.
 * Test and live never mix: an event may only touch an order of the same mode (`livemode`).
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
        if (session.payment_status === "paid" || session.payment_status === "no_payment_required") await onCheckoutPaid(session, livemodeOf(event));
        else await onCheckoutAwaitingPayment(session, livemodeOf(event));
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await onCheckoutFailed(session, event.type, livemodeOf(event));
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

const livemodeOf = (event: Stripe.Event): boolean => event.livemode === true;
const modeOf = (livemode: boolean): StripeMode => (livemode ? "live" : "test");

/** An order a session's event may touch: same mode, and never a customer order paid with a sandbox card once live. */
async function orderForSession(session: Stripe.Checkout.Session, livemode: boolean, what: string, opts: { payment?: boolean } = {}) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id ?? null;
  if (!orderId) {
    log.warn("stripe.session_without_order", { sessionId: session.id, what });
    return null;
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    log.warn("stripe.session_unknown_order", { orderId, sessionId: session.id, what });
    return null;
  }
  if (order.livemode !== livemode) {
    log.warn("stripe.mode_mismatch", { orderId, orderLivemode: order.livemode, eventLivemode: livemode, what });
    await notifyAdmins(`Stripe mode mismatch on order #${order.number}`, `A ${modeOf(livemode)} ${what} event arrived for a ${modeOf(order.livemode)} order. Ignored. Session ${session.id}.`);
    return null;
  }
  if (opts.payment && !livemode && checkoutMode() === "live" && !order.isTest) {
    // Checkout is live: a sandbox payment (test card) must not unlock a customer order for free.
    log.warn("stripe.sandbox_payment_ignored", { orderId, what });
    await notifyAdmins(`Sandbox payment ignored on order #${order.number}`, `Checkout is live, but order #${order.number} was paid in the sandbox. Nothing was delivered. Session ${session.id}.`);
    return null;
  }
  return order;
}

/** Async methods (bank debits) complete the checkout before the money arrives: keep the order open, never auto-close it. */
async function onCheckoutAwaitingPayment(session: Stripe.Checkout.Session, livemode: boolean): Promise<void> {
  const order = await orderForSession(session, livemode, "checkout completed (payment pending)");
  if (!order) return;
  await prisma.order.updateMany({ where: { id: order.id, status: "PENDING", checkoutCompletedAt: null }, data: { checkoutCompletedAt: new Date() } });
  log.info("stripe.checkout_not_paid_yet", { sessionId: session.id, status: session.payment_status });
  await track("checkout_payment_pending", { orderId: order.id, props: { status: session.payment_status } });
}

async function onCheckoutPaid(session: Stripe.Checkout.Session, livemode: boolean): Promise<void> {
  const order = await orderForSession(session, livemode, "payment", { payment: true });
  if (!order) return;
  const orderId = order.id;
  // Paid after we closed it as abandoned (a slow async method): take it back rather than keep money for nothing.
  const reopenable = order.status === "CANCELED" && (order.errorMessage ?? "").startsWith("abandoned checkout");
  if (order.status !== "PENDING" && !reopenable) {
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
      const pi = await stripe(modeOf(livemode)).paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
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

  // Conditional status change + payment row in one transaction: a second event for the same session (retry,
  // completed + async_payment_succeeded, concurrent deliveries) finds nothing to change and stops here.
  const now = new Date();
  const claimed = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, OR: [{ status: "PENDING" }, { status: "CANCELED", errorMessage: { startsWith: "abandoned checkout" } }] },
      data: { status: "PAID", paidAt: now, checkoutCompletedAt: order.checkoutCompletedAt ?? now, errorMessage: null, userId: user.id, customerEmail: email, stripePaymentIntentId: piId ?? undefined },
    });
    if (res.count === 0) return false;
    await tx.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: paid,
        currency: session.currency ?? order.currency,
        status: "SUCCEEDED",
        receiptUrl,
        raw: { sessionId: session.id, livemode } as object,
      },
    });
    return true;
  });
  if (!claimed) {
    log.info("stripe.paid_already_processed", { orderId, race: true });
    return;
  }
  if (reopenable) await notifyAdmins(`Order #${order.number} paid after it was closed as abandoned`, `A delayed payment arrived; the order is reopened and being fulfilled. Session ${session.id}.`);

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

async function onCheckoutFailed(session: Stripe.Checkout.Session, type: string, livemode: boolean): Promise<void> {
  const order = await orderForSession(session, livemode, type);
  if (!order) return;
  const res = await prisma.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "CANCELED", errorMessage: type } });
  if (res.count > 0) await track("checkout_abandoned", { orderId: order.id, props: { type } });
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
