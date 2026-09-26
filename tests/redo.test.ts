import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent } = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string; html?: string }> }));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string; html?: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: { sessions: { create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` })) } },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
    refunds: { create: vi.fn(async () => ({ id: "re_test_1" })) },
  };
  return { stripe: () => fake };
});

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { deliverOrder, redoOrder } from "@/lib/orders/service";
import { deliveredOutputs, lastDeliveredAt } from "@/lib/orders/deliverables";
import { resetDatabase, sampleListingClipsIntake } from "./helpers";

function paid(orderId: string, amount: number): Stripe.Event {
  return {
    id: `evt_redo_${orderId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        payment_intent: `pi_${orderId}`,
        customer_email: "agent@example.com",
        customer_details: { email: "agent@example.com", name: "Agent" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

const toCustomer = () => sent.filter((m) => m.to === "agent@example.com");
const loadOrder = (id: string) => prisma.order.findUniqueOrThrow({ where: { id }, include: { outputs: true } });

describe("free redo of a delivered order", () => {
  let adminId = "";

  beforeAll(async () => {
    await resetDatabase();
    const admin = await prisma.user.upsert({ where: { email: "admin@example.com" }, create: { email: "admin@example.com", role: "ADMIN" }, update: {} });
    adminId = admin.id;
  });

  it("re-runs an AUTO tool, replaces the files the customer sees and emails only the new ones as a redo", async () => {
    const { materializeTestIntake } = await import("@/lib/tools/samples/materialize");
    const { TEST_INTAKES } = await import("@/lib/tools/samples/test-intakes");
    const intake = await materializeTestIntake(TEST_INTAKES["virtual-staging"]);
    const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: intake });
    await handleStripeEvent(paid(orderId, 1500));

    const first = await loadOrder(orderId);
    expect(first.status).toBe("COMPLETED");
    const firstSet = deliveredOutputs(first.outputs);
    expect(firstSet.filter((o) => o.type === "IMAGE").map((o) => o.title)).toEqual(["Staged version 1 — modern living room", "Staged version 2 — modern living room"]);
    expect(firstSet.every((o) => o.version === 1)).toBe(true);
    const firstMail = toCustomer().at(-1);
    expect(firstMail?.subject).toBe("Your staged photos are ready");
    expect(firstMail?.text).toContain("one revision round is included");

    // only delivered orders can be redone
    const pending = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: await materializeTestIntake(TEST_INTAKES["virtual-staging"]) });
    await expect(redoOrder(pending.orderId, adminId)).rejects.toMatchObject({ code: "bad_state" });

    const mailsBefore = toCustomer().length;
    await redoOrder(orderId, adminId, "ceiling light was swapped");

    const after = await loadOrder(orderId);
    expect(after.status).toBe("COMPLETED");
    expect(after.deliveredAt?.getTime()).toBe(first.deliveredAt?.getTime()); // first delivery kept for SLA metrics
    expect(after.outputs).toHaveLength(first.outputs.length * 2); // the admin still has both runs
    const shown = deliveredOutputs(after.outputs);
    expect(shown.map((o) => o.id).some((id) => firstSet.some((f) => f.id === id))).toBe(false);
    expect(shown.filter((o) => o.type === "IMAGE").map((o) => o.title)).toEqual(["Staged version 1 — modern living room", "Staged version 2 — modern living room"]);
    expect(shown.every((o) => o.version === 2)).toBe(true);
    expect(lastDeliveredAt(after.outputs)!.getTime()).toBeGreaterThan(first.deliveredAt!.getTime());

    expect(toCustomer()).toHaveLength(mailsBefore + 1);
    const redoMail = toCustomer().at(-1)!;
    expect(redoMail.subject).toContain(`Your redo is ready — ORVIONIS order #${after.number}`);
    expect(redoMail.text).toContain("replaces the earlier files");
    for (const o of shown.filter((x) => x.fileId)) expect(redoMail.text).toContain(`/api/files/${o.fileId}?`);
    for (const o of firstSet.filter((x) => x.fileId)) expect(redoMail.text).not.toContain(`/api/files/${o.fileId}?`);

    const audit = await prisma.adminAction.findFirstOrThrow({ where: { action: "redo_order", targetId: orderId } });
    expect(audit.details).toMatchObject({ reason: "ceiling light was swapped", redoNumber: 1 });
    expect(await prisma.event.count({ where: { name: "order_redelivered", orderId } })).toBe(1);
    expect(await prisma.event.count({ where: { name: "order_delivered", orderId } })).toBe(1);
  });

  it("a concierge redo goes back to REVIEW, the customer keeps the last delivery until the new link is delivered", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-clips", email: "agent@example.com", intakeRaw: sampleListingClipsIntake });
    await handleStripeEvent(paid(orderId, 4900));
    expect((await loadOrder(orderId)).status).toBe("REVIEW");

    await deliverOrder(orderId, { by: "admin", adminId, deliveryLink: "https://drive.google.com/drive/folders/first", note: "Clip 3 uses the <kitchen> shot." });
    const delivered = await loadOrder(orderId);
    const firstSet = deliveredOutputs(delivered.outputs);
    expect(firstSet.at(-1)).toMatchObject({ type: "LINK", content: { url: "https://drive.google.com/drive/folders/first" } });
    const mail = toCustomer().at(-1)!;
    expect(mail.text).toContain("Clip 3 uses the <kitchen> shot.");
    expect(mail.html).toContain("Clip 3 uses the &lt;kitchen&gt; shot.");
    expect(mail.html).toContain('<a href="https://drive.google.com/drive/folders/first">');

    await redoOrder(orderId, adminId);
    const inReview = await loadOrder(orderId);
    expect(inReview.status).toBe("REVIEW");
    expect(inReview.dueAt!.getTime()).toBeGreaterThan(Date.now() + 47 * 3600 * 1000); // fresh promise for the redo
    expect(deliveredOutputs(inReview.outputs).map((o) => o.id)).toEqual(firstSet.map((o) => o.id));

    await deliverOrder(orderId, { by: "admin", adminId, deliveryLink: "https://drive.google.com/drive/folders/second" });
    const redone = await loadOrder(orderId);
    const shown = deliveredOutputs(redone.outputs);
    expect(shown.at(-1)).toMatchObject({ type: "LINK", content: { url: "https://drive.google.com/drive/folders/second" } });
    expect(shown.filter((o) => o.type === "LINK")).toHaveLength(1);
    expect(shown.some((o) => firstSet.some((f) => f.id === o.id))).toBe(false);
    expect(toCustomer().at(-1)!.subject).toContain("Your redo is ready");
  });
});
