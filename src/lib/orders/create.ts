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

  // Uploaded inputs (image fields) must be real, unclaimed INPUT files — never someone else's upload or an output.
  const fileIds = def.intake.fields
    .filter((f) => f.type === "image")
    .map((f) => intake[f.key])
    .filter((v): v is string => typeof v === "string" && v.length > 0);
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

  if (fileIds.length > 0) {
    // Claim the uploads for this order and keep them as long as the outputs (the order page shows before/after).
    await prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { orderId: order.id, expiresAt: new Date(Date.now() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) },
    });
  }

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
