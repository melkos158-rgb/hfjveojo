import { prisma } from "@/lib/db";
import { appUrl, env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken } from "@/lib/security/tokens";
import { stripe } from "@/lib/stripe/client";
import { track, type Attribution } from "@/lib/analytics/events";
import { normalizeEmail } from "@/lib/auth/magic";
import { z } from "zod";

export type CreateOrderInput = {
  toolSlug: string;
  email: string;
  intakeRaw: unknown;
  attribution?: Attribution | null;
  userId?: string | null;
  sessionId?: string | null;
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

  // Experiment attribution (first-touch stored with the order)
  const experiment = input.attribution?.exp
    ? await prisma.experiment.findUnique({ where: { key: input.attribution.exp }, include: { variants: true } })
    : null;
  const variant = experiment && input.attribution?.variant ? experiment.variants.find((v) => v.key === input.attribution?.variant) : null;

  const order = await prisma.order.create({
    data: {
      userId: input.userId ?? undefined,
      customerEmail: email,
      customerName: typeof intake.agentName === "string" ? intake.agentName : typeof intake.photographerName === "string" ? intake.photographerName : null,
      toolId: def.id,
      toolVersion: def.version,
      productId: product.id,
      status: "PENDING",
      intake: intake as object,
      amountCents: product.priceCents,
      currency: product.currency,
      accessToken: randomToken(24),
      attribution: (input.attribution as object) ?? undefined,
      experimentId: experiment?.id,
      variantId: variant?.id,
      dueAt: new Date(Date.now() + def.sla.deliveryHours * 3600 * 1000),
    },
  });

  const successUrl = appUrl(`/checkout/success?order=${order.id}&t=${encodeURIComponent(order.accessToken)}`);
  const cancelUrl = appUrl(`/checkout/cancel?order=${order.id}&tool=${def.slug}`);

  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.id,
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency || env().STRIPE_CURRENCY,
            unit_amount: product.priceCents,
            product_data: { name: product.name, description: def.tagline.slice(0, 200) },
          },
        },
      ],
      metadata: { orderId: order.id, toolId: def.id, sku: product.sku },
      payment_intent_data: { metadata: { orderId: order.id, toolId: def.id } },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    { idempotencyKey: `checkout_${order.id}` },
  );
  if (!session.url) throw new AppError("Stripe did not return a checkout URL", 502, "stripe_no_url");

  await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
  await track("checkout_started", {
    orderId: order.id,
    sessionId: input.sessionId ?? undefined,
    userId: input.userId ?? undefined,
    experimentId: experiment?.id,
    props: { tool: def.id, amountCents: product.priceCents },
  });
  return { orderId: order.id, checkoutUrl: session.url };
}
