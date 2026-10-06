import { prisma } from "@/lib/db";
import { appUrl, env } from "@/lib/env";
import { AppError, RateLimitedError, reportError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/ratelimit";
import { log } from "@/lib/logger";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken, safeEqual } from "@/lib/security/tokens";
import { stripe } from "@/lib/stripe/client";
import { checkoutMode, isTestOrder, type StripeMode } from "@/lib/stripe/mode";
import { photoInputsOf, quantityOf } from "@/lib/tools/photos";
import { packApplies, volumeTotalCents } from "@/lib/tools/volume";
import { STAGING_FINISH_PACK } from "@/config/staging-pricing";
import { checkFinish, FINISH_TOOL_SLUG } from "@/lib/orders/finish";
import { CREDIT_KEY_PREFIX, CREDIT_USE_TOOL_SLUG, creditBalance } from "@/lib/orders/credits";
import type { ToolDefinition } from "@/lib/tools/types";
import { track, type Attribution } from "@/lib/analytics/events";
import { normalizeEmail } from "@/lib/auth/magic";
import { z } from "zod";

/**
 * The Stripe client for a checkout. A mode without a key (e.g. a key swapped in Railway mid-switch) must not show the
 * customer server internals: they get a plain "try again in a few minutes" (nothing was charged, no order exists yet),
 * and the admins get one email per hour saying exactly which variable is missing.
 */
function checkoutClient(mode: StripeMode) {
  try {
    return stripe(mode);
  } catch (err) {
    if (!(err instanceof AppError) || err.code !== "stripe_not_configured") throw err;
    void alertCheckoutDown(mode);
    throw new AppError("Checkout is being updated right now — please try again in a few minutes. Nothing was charged.", 503, "checkout_unavailable");
  }
}

async function alertCheckoutDown(mode: StripeMode): Promise<void> {
  try {
    await reportError(new Error(`Customer checkout refused: no Stripe ${mode} key`), { mode });
    await rateLimit({ key: "alert:checkout_down", limit: 1, windowSeconds: 3600 });
    const { notifyAdmins } = await import("@/lib/orders/service");
    await notifyAdmins(
      `Checkout is DOWN — no Stripe ${mode} key`,
      `A customer checkout was refused: STRIPE_MODE/mode is "${mode}" but no ${mode} secret key is set (${mode === "live" ? "STRIPE_LIVE_SECRET_KEY, or a sk_live_ key in STRIPE_SECRET_KEY" : "a sk_test_ key in STRIPE_SECRET_KEY"}).\nFix it in Railway → hfjveojo → Variables, or switch STRIPE_MODE. /admin/system shows the state of both modes.\nThis alert is sent at most once an hour.`,
    );
  } catch (err) {
    if (!(err instanceof RateLimitedError)) log.warn("checkout.alert_failed", { error: (err as Error).message });
  }
}

export type CreateOrderInput = {
  toolSlug: string;
  email: string;
  intakeRaw: unknown;
  attribution?: Attribution | null;
  userId?: string | null;
  sessionId?: string | null;
  /** Stripe mode for this checkout. Default: STRIPE_MODE. Admin sandbox checkouts and pipeline tests pass "test". */
  mode?: StripeMode;
  /** Mark as a test order (excluded from revenue). Sandbox orders in production are always test orders. */
  isTest?: boolean;
  /** The owner's/operator's own device: the checkout does not count as a visitor funnel event. */
  internal?: boolean;
  /** "Finish this listing" link of a delivered free photo (src/lib/orders/finish.ts): the finish price applies. */
  finish?: string | null;
  /** Pay with Pro credits (src/lib/orders/credits.ts): the signed-in user's email must be the order email. */
  useCredits?: boolean;
  sessionEmail?: string | null;
};

/**
 * Validates the intake against the tool's schema, prices the order SERVER-SIDE from the Product table,
 * creates a PENDING order and a Stripe Checkout Session. Nothing about price or status is taken from the client.
 */
export async function createOrderWithCheckout(input: CreateOrderInput): Promise<{ orderId: string; checkoutUrl: string }> {
  const def = getToolBySlug(input.toolSlug);
  if (!def) throw new AppError("Unknown tool", 404, "unknown_tool");

  const tool = await prisma.tool.findUnique({ where: { id: def.id } });
  if (!tool || !["LIVE", "VALIDATING"].includes(tool.status)) {
    throw new AppError("This tool is not accepting orders right now", 409, "tool_unavailable");
  }
  const product = await prisma.product.findFirst({ where: { toolId: def.id, active: true, type: "ONE_TIME" } });
  if (!product) throw new AppError("No active price for this tool", 409, "no_product");

  const email = z.email().parse(normalizeEmail(input.email));
  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;

  // Uploaded inputs (photos) must be real, unclaimed INPUT files — never someone else's upload or an output.
  const fileIds = [...new Set(photoInputsOf(def as ToolDefinition<unknown>, intake).map((p) => p.fileId))];
  // Units charged (e.g. rooms): the total is always computed here, never taken from the client.
  const quantity = quantityOf(def as ToolDefinition<unknown>, intake);
  // Volume and pack pricing (staging: $15 a room, the Listing Pack $49 for up to 5 rooms, $99 for 10), never more than a
  // larger order would cost.
  const maxUnits = Math.max(quantity, def.intake.fields.find((f) => f.type === "rooms")?.max ?? quantity);
  // "Finish this listing": the free photo's room counts as the first room of the pack (checked again here).
  const finish = input.finish && def.slug === FINISH_TOOL_SLUG ? await checkFinish(input.finish) : null;
  if (finish && !finish.ok) {
    throw new AppError("The $39 offer for this listing has ended (it runs 7 days after your free photo). Reload the page for the regular price.", 400, "finish_expired");
  }
  if (finish?.ok) intake.finishOf = finish.freeOrderId;
  const pack = finish?.ok ? STAGING_FINISH_PACK : (def.pricing.pack ?? null);
  const unitsCents = volumeTotalCents(quantity, product.priceCents, def.pricing.volume, maxUnits, pack);
  const isPack = packApplies(quantity, product.priceCents, def.pricing.volume, maxUnits, pack);
  // The optional extra (staging: the $7 MLS description on 1-3 rooms) only where the pack doesn't already include it.
  const addon = def.pricing.addon && !isPack && intake[def.pricing.addon.key] === true ? def.pricing.addon : null;
  const totalCents = unitsCents + (addon?.cents ?? 0);
  // The pack's extra or the add-on is delivered as a voucher (src/lib/orders/voucher.ts); the order remembers it.
  if (def.pricing.addon) intake[def.pricing.addon.key] = Boolean(addon);
  if (isPack || addon) intake.extraIncluded = true;
  // Stripe shows "n × unit price" when the units are priced per unit, one "pack" line otherwise, plus the add-on.
  const perUnitLine = !isPack && unitsCents % quantity === 0;
  if (fileIds.length > 0) {
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, kind: true, orderId: true, userId: true, expiresAt: true, order: { select: { status: true, customerEmail: true } } },
    });
    for (const id of fileIds) {
      const f = files.find((x) => x.id === id);
      // A file already attached to an abandoned checkout of the same customer may be re-used (browser "back" → submit again).
      const reusable = !f?.orderId || (f.order && ["PENDING", "CANCELED"].includes(f.order.status) && f.order.customerEmail === email);
      const ok = f && f.kind === "INPUT" && reusable && (!f.expiresAt || f.expiresAt > new Date()) && (!f.userId || !input.userId || f.userId === input.userId);
      if (!ok) throw new AppError("The uploaded photo could not be found — please upload it again.", 400, "upload_missing");
    }
  }

  // Pro credits: a staging order paid from the signed-in buyer's balance, no checkout.
  if (input.useCredits) return redeemWithCredits({ input, def, product, email, intake, quantity, fileIds });

  // Experiment attribution (first-touch stored with the order)
  const experiment = input.attribution?.exp
    ? await prisma.experiment.findUnique({ where: { key: input.attribution.exp }, include: { variants: true } })
    : null;
  const variant = experiment && input.attribution?.variant ? experiment.variants.find((v) => v.key === input.attribution?.variant) : null;

  const mode = input.mode ?? checkoutMode();
  const client = checkoutClient(mode); // fails before an order exists when this mode has no key

  const order = await prisma.order.create({
    data: {
      isTest: isTestOrder(mode, input.isTest),
      publicToken: def.disclosurePack ? randomToken(12) : undefined,
      userId: input.userId ?? undefined,
      customerEmail: email,
      customerName: typeof intake.agentName === "string" ? intake.agentName : typeof intake.photographerName === "string" ? intake.photographerName : null,
      toolId: def.id,
      toolVersion: def.version,
      productId: product.id,
      status: "PENDING",
      intake: intake as object,
      amountCents: totalCents,
      quantity,
      currency: product.currency,
      accessToken: randomToken(24),
      attribution: (input.attribution as object) ?? undefined,
      experimentId: experiment?.id,
      variantId: variant?.id,
      dueAt: new Date(Date.now() + def.sla.deliveryHours * 3600 * 1000),
    },
  });

  if (fileIds.length > 0) {
    // Claim the uploads for this order and keep them as long as the outputs (the order page shows before/after).
    await prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { orderId: order.id, expiresAt: new Date(Date.now() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) },
    });
  }

  const session = await openCheckoutSession(client, {
    order: { id: order.id, number: order.number, accessToken: order.accessToken },
    def,
    product,
    email,
    mode,
    lines: { quantity, unitsCents, perUnitLine, isPack, addon, finish: Boolean(finish?.ok) },
    idempotencyKey: `checkout_${order.id}`,
  });
  if (!input.internal) await track("checkout_started", {
    orderId: order.id,
    sessionId: input.sessionId ?? undefined,
    userId: input.userId ?? undefined,
    experimentId: experiment?.id,
    props: { tool: def.id, amountCents: totalCents, quantity, mode, ...(pack ? { pack: isPack } : {}), ...(def.pricing.addon ? { addon: Boolean(addon) } : {}), ...(finish?.ok ? { finish: true } : {}) },
  });
  return { orderId: order.id, checkoutUrl: session.url as string };
}

type CheckoutLines = {
  quantity: number;
  unitsCents: number;
  perUnitLine: boolean;
  isPack: boolean;
  addon: { key: string; cents: number; label: string } | null;
  finish: boolean;
};

/**
 * One Stripe Checkout session for an order, priced by `lines` (computed when the order was created, never from the
 * client). The session's own livemode is recorded: only events of the same mode may ever change the order's payment
 * state. Used by createOrderWithCheckout and resumeCheckout.
 */
async function openCheckoutSession(
  client: ReturnType<typeof stripe>,
  args: {
    order: { id: string; number: number; accessToken: string };
    def: ToolDefinition<unknown> | NonNullable<ReturnType<typeof getToolBySlug>>;
    product: { name: string; currency: string; sku: string };
    email: string;
    mode: StripeMode;
    lines: CheckoutLines;
    idempotencyKey: string;
  },
) {
  const { order, def, product, email, mode, lines } = args;
  const currency = product.currency || env().STRIPE_CURRENCY;
  const many = def.pricing.unit?.many ?? "units";
  const successUrl = appUrl(`/checkout/success?order=${order.id}&t=${encodeURIComponent(order.accessToken)}`);
  // The cancel page offers to resume this order (src/app/api/orders/[id]/resume), so it carries the private token.
  const cancelUrl = appUrl(`/checkout/cancel?order=${order.id}&tool=${def.slug}&t=${encodeURIComponent(order.accessToken)}`);
  const session = await client.checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.id,
      customer_email: email,
      line_items: [
        {
          quantity: lines.perUnitLine ? lines.quantity : 1,
          price_data: {
            currency,
            unit_amount: lines.perUnitLine ? lines.unitsCents / lines.quantity : lines.unitsCents,
            product_data: {
              name: lines.isPack
                ? `${product.name} — ${lines.finish ? "Finish this listing" : "Listing Pack"} (${lines.quantity} ${many} + ${def.pricing.packIncludes ?? "extras"})`
                : lines.perUnitLine || lines.quantity === 1
                  ? product.name
                  : `${product.name} (${lines.quantity} ${many})`,
              description: def.tagline.slice(0, 200),
            },
          },
        },
        ...(lines.addon
          ? [
              {
                quantity: 1,
                price_data: {
                  currency,
                  unit_amount: lines.addon.cents,
                  product_data: { name: lines.addon.label, description: "Delivered with your order: a link to write the description for this listing." },
                },
              },
            ]
          : []),
      ],
      metadata: { orderId: order.id, toolId: def.id, sku: product.sku },
      payment_intent_data: {
        metadata: { orderId: order.id, toolId: def.id },
        // Stripe's own receipt (sent in live mode whenever receipt_email is set, no email provider of ours needed)
        // carries this description — so the customer always has a mail with their private order link.
        description: `ORVIONIS order #${order.number} — ${product.name}. Your files: ${appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`)}`,
        receipt_email: email,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    { idempotencyKey: args.idempotencyKey },
  );
  if (!session.url) throw new AppError("Stripe did not return a checkout URL", 502, "stripe_no_url");
  const livemode = session.livemode === true;
  if (livemode !== (mode === "live")) {
    throw new AppError(`Stripe returned a ${livemode ? "live" : "test"} session for a ${mode} checkout — check the ${mode} key`, 500, "stripe_mode_mismatch");
  }
  await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id, livemode } });
  return session;
}

/** How long an unpaid order can be picked up again from the cancel page or the reminder email. */
export const RESUME_HOURS = 24;
/** A checkout session lives 30 minutes; a new one is only opened once the old one can no longer be paid. */
const SESSION_MINUTES = 31;

export type ResumeOutcome = { url: string; kind: "checkout" | "order" | "form" };

/**
 * Re-open checkout for an unpaid order: the same order, photos and price, in a new Stripe session. Only once the first
 * session has expired (so nobody can pay twice) and within RESUME_HOURS of the order; a paid order goes to its page,
 * anything else back to the order form.
 */
export async function resumeCheckout(orderId: string, token: string | null | undefined): Promise<ResumeOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true, tool: true } });
  if (!order || !token || !safeEqual(order.accessToken, token)) return { url: appUrl("/tools"), kind: "form" };
  const def = getToolBySlug(order.tool.slug);
  const formUrl = appUrl(`/tools/${order.tool.slug}#order`);
  if (!["PENDING", "CANCELED"].includes(order.status)) return { url: appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`), kind: "order" };
  const ageMs = Date.now() - order.createdAt.getTime();
  // Back from Stripe a moment ago: the first session is still open, so the customer simply goes back to it.
  if (order.status === "PENDING" && order.stripeCheckoutSessionId && order.livemode !== null && ageMs <= SESSION_MINUTES * 60_000) {
    try {
      const open = await checkoutClient(order.livemode ? "live" : "test").checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      if (open.status === "open" && open.url) return { url: open.url, kind: "checkout" };
    } catch (err) {
      log.warn("orders.resume_retrieve_failed", { orderId: order.id, error: (err as Error).message });
    }
    return { url: formUrl, kind: "form" };
  }
  const expiredSession = order.status === "CANCELED" && order.errorMessage === "checkout.session.expired";
  const stalePending = order.status === "PENDING" && !order.checkoutCompletedAt && ageMs > SESSION_MINUTES * 60_000;
  if (!def || order.free || ageMs > RESUME_HOURS * 3600_000 || !(expiredSession || stalePending) || order.livemode === null) return { url: formUrl, kind: "form" };

  const mode: StripeMode = order.livemode ? "live" : "test";
  const client = checkoutClient(mode);
  // Belt and braces: make sure the earlier session can't be paid any more (it normally expired already).
  if (order.stripeCheckoutSessionId) {
    try {
      await client.checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch {
      // already expired or completed: nothing to do
    }
  }
  const intake = (order.intake ?? {}) as Record<string, unknown>;
  const addon = def.pricing.addon && intake[def.pricing.addon.key] === true ? def.pricing.addon : null;
  const unitsCents = order.amountCents - (addon?.cents ?? 0);
  const isPack = intake.extraIncluded === true && !addon;
  const lines: CheckoutLines = { quantity: order.quantity, unitsCents, perUnitLine: !isPack && unitsCents % order.quantity === 0, isPack, addon, finish: typeof intake.finishOf === "string" };
  await prisma.order.update({ where: { id: order.id }, data: { status: "PENDING", errorMessage: null } });
  const session = await openCheckoutSession(client, {
    order: { id: order.id, number: order.number, accessToken: order.accessToken },
    def,
    product: order.product,
    email: order.customerEmail,
    mode,
    lines,
    idempotencyKey: `checkout_${order.id}_resume_${Math.floor(Date.now() / 60_000)}`,
  });
  await track("checkout_resumed", { orderId: order.id, props: { tool: def.id, amountCents: order.amountCents } });
  return { url: session.url as string, kind: "checkout" };
}

/**
 * A staging order paid with Pro credits: created paid for $0 (`free`, freeKey "credit:…") and queued at once. The
 * balance check and the order are one transaction under a per-email advisory lock, so two orders sent at the same time
 * cannot spend the same rooms.
 */
async function redeemWithCredits(a: {
  input: CreateOrderInput;
  def: NonNullable<ReturnType<typeof getToolBySlug>>;
  product: { id: string; currency: string };
  email: string;
  intake: Record<string, unknown>;
  quantity: number;
  fileIds: string[];
}): Promise<{ orderId: string; checkoutUrl: string }> {
  const { input, def, product, email, intake, quantity, fileIds } = a;
  if (def.slug !== CREDIT_USE_TOOL_SLUG) throw new AppError("Pro credits are for virtual staging orders.", 400, "credits_tool");
  if (!input.sessionEmail || normalizeEmail(input.sessionEmail) !== email) {
    throw new AppError("Sign in with the email that bought the credits to use them.", 403, "credits_sign_in");
  }
  // Credits pay for rooms only: no add-on, no voucher, no finish-this-listing price on these orders.
  if (def.pricing.addon) intake[def.pricing.addon.key] = false;
  delete intake.extraIncluded;
  delete intake.finishOf;
  const now = new Date();
  const order = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`credits:${email}`}))`;
    const balance = await creditBalance(email, now, tx);
    if (balance.rooms < quantity) {
      throw new AppError(
        balance.rooms === 0
          ? "There are no Pro credits left on this account. Untick “Use my Pro credits” to pay for this order."
          : `Your Pro credits cover ${balance.rooms} room${balance.rooms === 1 ? "" : "s"}: remove some photos or untick “Use my Pro credits” to pay.`,
        409,
        "credits_short",
      );
    }
    return tx.order.create({
      data: {
        isTest: Boolean(input.isTest),
        publicToken: def.disclosurePack ? randomToken(12) : undefined,
        userId: input.userId ?? undefined,
        customerEmail: email,
        toolId: def.id,
        toolVersion: def.version,
        productId: product.id,
        status: "PAID",
        paidAt: now,
        free: true,
        freeKey: `${CREDIT_KEY_PREFIX}${randomToken(12)}`,
        intake: { ...intake, paidWithCredits: true } as object,
        amountCents: 0,
        quantity,
        currency: product.currency,
        accessToken: randomToken(24),
        attribution: (input.attribution as object) ?? undefined,
        dueAt: new Date(now.getTime() + def.sla.deliveryHours * 3600 * 1000),
      },
    });
  });
  if (fileIds.length > 0) {
    await prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { orderId: order.id, expiresAt: new Date(Date.now() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) },
    });
  }
  await track("credits_redeemed", { orderId: order.id, userId: input.userId ?? undefined, props: { tool: def.id, rooms: quantity } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId: order.id }, { orderId: order.id });
  return { orderId: order.id, checkoutUrl: appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`) };
}
