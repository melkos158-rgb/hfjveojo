import { prisma } from "@/lib/db";
import { appUrl, env } from "@/lib/env";
import { AppError, RateLimitedError, reportError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/ratelimit";
import { log } from "@/lib/logger";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken } from "@/lib/security/tokens";
import { stripe } from "@/lib/stripe/client";
import { checkoutMode, isTestOrder, type StripeMode } from "@/lib/stripe/mode";
import { photoInputsOf, quantityOf } from "@/lib/tools/photos";
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
      amountCents: product.priceCents * quantity,
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

  const successUrl = appUrl(`/checkout/success?order=${order.id}&t=${encodeURIComponent(order.accessToken)}`);
  const cancelUrl = appUrl(`/checkout/cancel?order=${order.id}&tool=${def.slug}`);

  const session = await client.checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.id,
      customer_email: email,
      line_items: [
        {
          quantity,
          price_data: {
            currency: product.currency || env().STRIPE_CURRENCY,
            unit_amount: product.priceCents,
            product_data: { name: product.name, description: def.tagline.slice(0, 200) },
          },
        },
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
    { idempotencyKey: `checkout_${order.id}` },
  );
  if (!session.url) throw new AppError("Stripe did not return a checkout URL", 502, "stripe_no_url");

  // The session's own livemode is recorded: only events of the same mode may ever change this order's payment state.
  const livemode = session.livemode === true;
  if (livemode !== (mode === "live")) {
    throw new AppError(`Stripe returned a ${livemode ? "live" : "test"} session for a ${mode} checkout — check the ${mode} key`, 500, "stripe_mode_mismatch");
  }
  await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id, livemode } });
  await track("checkout_started", {
    orderId: order.id,
    sessionId: input.sessionId ?? undefined,
    userId: input.userId ?? undefined,
    experimentId: experiment?.id,
    props: { tool: def.id, amountCents: product.priceCents * quantity, quantity, mode },
  });
  return { orderId: order.id, checkoutUrl: session.url };
}
