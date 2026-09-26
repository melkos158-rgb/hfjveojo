import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: { sessions: { create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` })) } },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
    refunds: { create: vi.fn(async () => ({ id: "re_test_1" })) },
  };
  return { stripe: () => fake };
});

import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { refundOrder, deliverOrder } from "@/lib/orders/service";
import { AppError } from "@/lib/errors";
import { resetDatabase, samplePricingGuideIntake, sampleListingClipsIntake, sampleListingDescriptionIntake } from "./helpers";
import type Stripe from "stripe";
import { readFileSync } from "node:fs";
import { REQUIRED_WEBHOOK_EVENTS } from "@/lib/stripe/branding";

function checkoutCompletedEvent(orderId: string, amount: number, id = `evt_${orderId}`): Stripe.Event {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        payment_intent: `pi_${orderId}`,
        customer_email: "buyer@example.com",
        customer_details: { email: "buyer@example.com", name: "Buyer" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

describe("order → checkout → webhook → fulfilment", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("prices the order server-side and returns a checkout URL", async () => {
    const res = await createOrderWithCheckout({ toolSlug: "photographer-pricing-guide", email: "Buyer@Example.com", intakeRaw: samplePricingGuideIntake });
    expect(res.checkoutUrl).toContain("checkout.stripe.com");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.orderId } });
    expect(order.status).toBe("PENDING");
    expect(order.amountCents).toBe(2900);
    expect(order.customerEmail).toBe("buyer@example.com");
    expect(order.stripeCheckoutSessionId).toBe(`cs_test_${order.id}`);
    // Stripe's receipt carries the private order link and goes to the buyer even without our own email provider
    const { stripe } = await import("@/lib/stripe/client");
    const call = (stripe().checkout.sessions.create as unknown as { mock: { calls: unknown[][] } }).mock.calls.at(-1)?.[0] as {
      payment_intent_data: { description: string; receipt_email: string };
    };
    expect(call.payment_intent_data.receipt_email).toBe("buyer@example.com");
    expect(call.payment_intent_data.description).toContain(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`);
    expect(call.payment_intent_data.description).toContain(`#${order.number}`);
  });

  it("an admin pipeline test order runs the real pipeline but stays out of the metrics", async () => {
    const { computeKpis } = await import("@/lib/analytics/kpi");
    const before = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-description", email: "admin@example.com", intakeRaw: sampleListingDescriptionIntake, attribution: { utm_source: "admin_pipeline_test" } });
    await prisma.order.update({ where: { id: orderId }, data: { isTest: true } });
    await handleStripeEvent({
      ...checkoutCompletedEvent(orderId, 900, `evt_admintest_${orderId}`),
      data: { object: { ...checkoutCompletedEvent(orderId, 900).data.object, payment_intent: null } },
    } as unknown as Stripe.Event);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true } });
    expect(order.status).toBe("COMPLETED");
    expect(order.isTest).toBe(true);
    expect(order.payments[0]?.stripePaymentIntentId).toBeNull();
    const after = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    expect(after.ordersPaid).toBe(before.ordersPaid);
    expect(after.revenueCents).toBe(before.revenueCents);
  });

  it("the webhook event list shown to the admin matches the events the handler implements", () => {
    const src = readFileSync("src/lib/stripe/webhooks.ts", "utf8");
    const handled = [...src.matchAll(/case "([a-z_.]+)":/g)].map((m) => m[1]).sort();
    expect([...REQUIRED_WEBHOOK_EVENTS].sort()).toEqual(handled);
  });

  it("rejects invalid intake with a 400 AppError", async () => {
    await expect(createOrderWithCheckout({ toolSlug: "listing-clips", email: "a@b.co", intakeRaw: { ...sampleListingClipsIntake, videoLink: "https://evil.example/x" } })).rejects.toBeInstanceOf(AppError);
  });

  it("processes checkout.session.completed exactly once and fulfils the order (mock AI, inline jobs)", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "photographer-pricing-guide", email: "buyer@example.com", intakeRaw: samplePricingGuideIntake });
    const first = await handleStripeEvent(checkoutCompletedEvent(orderId, 2900));
    expect(first.duplicate).toBe(false);
    const second = await handleStripeEvent(checkoutCompletedEvent(orderId, 2900));
    expect(second.duplicate).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, outputs: true, aiRequests: true, user: true } });
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0].status).toBe("SUCCEEDED");
    expect(order.paidAt).not.toBeNull();
    expect(order.user?.email).toBe("buyer@example.com");
    // AUTO tool with mock AI → delivered
    expect(order.status).toBe("COMPLETED");
    expect(order.outputs.some((o) => o.type === "PDF")).toBe(true);
    expect(order.aiRequests.length).toBeGreaterThanOrEqual(1);
  });

  it("fulfils a listing-description order end to end (mock AI): markdown + file, delivered", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-description", email: "agent@example.com", intakeRaw: sampleListingDescriptionIntake });
    await handleStripeEvent(checkoutCompletedEvent(orderId, 900));
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: { include: { file: true } } } });
    expect(order.amountCents).toBe(900);
    expect(order.status).toBe("COMPLETED");
    const md = order.outputs.find((o) => o.type === "MARKDOWN");
    expect(md).toBeTruthy();
    expect(md?.file?.name).toMatch(/listing-copy\.md$/);
    expect((md?.content as { markdown: string }).markdown).toContain("## MLS description");
  });

  it("fulfils a virtual-staging order end to end (mock image edit): upload claimed, 2 staged PNGs + details, delivered", async () => {
    const { materializeTestIntake } = await import("@/lib/tools/samples/materialize");
    const { TEST_INTAKES } = await import("@/lib/tools/samples/test-intakes");
    const intake = await materializeTestIntake(TEST_INTAKES["virtual-staging"]);
    const photoFileId = intake.photoFileId as string;
    expect(photoFileId).toMatch(/^c[a-z0-9]{20,}$/);

    // a made-up or foreign file id is refused before any money moves
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: { ...intake, photoFileId: "clnotarealfileid00000000" } })).rejects.toMatchObject({ code: "upload_missing" });

    const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: intake });
    const claimed = await prisma.file.findUniqueOrThrow({ where: { id: photoFileId } });
    expect(claimed.orderId).toBe(orderId);
    expect(claimed.kind).toBe("INPUT");

    // the same upload cannot be attached to another customer's order
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "someone-else@example.com", intakeRaw: intake })).rejects.toMatchObject({ code: "upload_missing" });
    // …but the same customer may retry an abandoned checkout with it
    const retry = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: intake });
    expect(retry.orderId).not.toBe(orderId);

    await handleStripeEvent(checkoutCompletedEvent(retry.orderId, 1500));
    const order = await prisma.order.findUniqueOrThrow({ where: { id: retry.orderId }, include: { outputs: { include: { file: true } }, runs: true } });
    expect(order.amountCents).toBe(1500);
    expect(order.status).toBe("COMPLETED");
    const images = order.outputs.filter((o) => o.type === "IMAGE");
    expect(images).toHaveLength(2);
    expect(images.map((o) => o.file?.name).sort()).toEqual(["staged-living-room-modern-v1.jpg", "staged-living-room-modern-v2.jpg"]);
    for (const img of images) {
      expect(img.file?.kind).toBe("OUTPUT");
      expect(img.file?.mime).toBe("image/jpeg");
      expect(img.file?.sizeBytes ?? 0).toBeGreaterThan(20_000);
      expect(img.file?.data?.slice(0, 3)).toEqual(new Uint8Array([0xff, 0xd8, 0xff])); // real JPEG bytes
    }
    const details = order.outputs.find((o) => o.type === "JSON");
    expect((details?.content as { style: string; versions: number }).style).toBe("modern");
    expect((details?.content as { versions: number }).versions).toBe(2);
    const ai = await prisma.aiRequest.findMany({ where: { orderId: retry.orderId } });
    expect(ai).toHaveLength(1);
    expect(ai[0].purpose).toBe("stage");
  });

  it("parks concierge orders in REVIEW and lets an admin deliver with a link", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-clips", email: "agent@example.com", intakeRaw: sampleListingClipsIntake });
    await handleStripeEvent(checkoutCompletedEvent(orderId, 4900));
    let order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("REVIEW");

    const admin = await prisma.user.upsert({ where: { email: "admin@example.com" }, create: { email: "admin@example.com", role: "ADMIN" }, update: {} });
    await deliverOrder(orderId, { by: "admin", adminId: admin.id, deliveryLink: "https://drive.google.com/drive/folders/xyz" });
    order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: true } });
    expect(order.status).toBe("COMPLETED");
    expect(order.deliveredAt).not.toBeNull();
  });

  it("ignores paid events for unknown orders and does not throw", async () => {
    const res = await handleStripeEvent(checkoutCompletedEvent("does-not-exist", 100, "evt_unknown"));
    expect(res.handled).toBe(true);
  });

  it("refunds through Stripe and updates payment + order state", async () => {
    const paid = await prisma.order.findFirstOrThrow({ where: { status: "COMPLETED", toolId: "photo-pricing-guide" }, include: { payments: true } });
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
    await refundOrder(paid.id, { adminId: admin.id, reason: "test" });
    const after = await prisma.order.findUniqueOrThrow({ where: { id: paid.id }, include: { payments: true, refunds: true } });
    expect(after.status).toBe("REFUNDED");
    expect(after.payments[0].status).toBe("REFUNDED");
    expect(after.refunds[0].status).toBe("SUCCEEDED");
    await expect(refundOrder(paid.id, { adminId: admin.id })).rejects.toBeInstanceOf(AppError);
  });
});
