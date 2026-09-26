import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent } = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string }> }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));
// A marketplace order must never touch Stripe — any call fails the test.
vi.mock("@/lib/stripe/client", () => ({
  stripe: () => {
    throw new Error("Stripe must not be called for an external order");
  },
}));

import { prisma } from "@/lib/db";
import { createExternalOrder } from "@/lib/orders/external";
import { refundOrder } from "@/lib/orders/service";
import { computeKpis } from "@/lib/analytics/kpi";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { resetDatabase } from "./helpers";

describe("orders paid on a marketplace (Fiverr, Upwork, direct deals)", () => {
  let adminId = "";
  beforeAll(async () => {
    await resetDatabase();
    adminId = (await prisma.user.create({ data: { email: "admin@example.com", role: "ADMIN" } })).id;
  });

  it("runs through the pipeline, counts as channel revenue with the channel's fee, and refunds are recorded without Stripe", async () => {
    const intake = await materializeTestIntake({
      rooms: [
        { photoFileId: "@file:img/sample-staging-before.jpg", roomType: "living room" },
        { photoFileId: "@file:img/sample-staging-before.jpg", roomType: "bedroom" },
      ],
      style: "coastal",
    });
    const { orderId } = await createExternalOrder({
      toolSlug: "virtual-staging",
      intakeRaw: { ...intake, rooms: JSON.stringify(intake.rooms) },
      channel: "fiverr",
      amountCents: 3000,
      feeCents: 600,
      externalRef: "FO123ABC",
      deliverTo: "admin@example.com",
      adminId,
    });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, outputs: true } });
    expect(order.status).toBe("COMPLETED"); // the normal pipeline ran (inline jobs)
    expect([order.isTest, order.livemode, order.quantity, order.amountCents]).toEqual([false, false, 2, 3000]);
    expect(order.attribution).toMatchObject({ utm_source: "fiverr", utm_medium: "marketplace", ref: "FO123ABC" });
    expect(order.payments[0]).toMatchObject({ amountCents: 3000, feeCents: 600, netCents: 2400, status: "SUCCEEDED", stripePaymentIntentId: null });
    expect(order.outputs.filter((o) => o.type === "IMAGE").length).toBe(8); // 2 rooms × (2 versions + 2 labeled)
    expect(sent.some((m) => m.to === "admin@example.com" && m.subject === "Your staged photos are ready")).toBe(true);
    expect(await prisma.adminAction.count({ where: { action: "external_order", targetId: orderId } })).toBe(1);

    const k = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    expect(k.revenueCents).toBe(3000);
    expect(k.stripeFeesCents).toBe(600);
    expect(k.byChannel.find((c) => c.source === "fiverr")).toMatchObject({ paid: 1, revenueCents: 3000 });

    await refundOrder(orderId, { adminId });
    const refunded = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { refunds: true, payments: true } });
    expect(refunded.status).toBe("REFUNDED");
    expect(refunded.refunds[0]).toMatchObject({ status: "SUCCEEDED", amountCents: 3000, reason: "refunded on fiverr" });
    expect(refunded.payments[0].status).toBe("REFUNDED");
  });

  it("refuses a fee above the amount, an invalid intake and unknown tools", async () => {
    const base = { channel: "direct" as const, deliverTo: "admin@example.com", adminId };
    await expect(createExternalOrder({ ...base, toolSlug: "virtual-staging", intakeRaw: {}, amountCents: 1500, feeCents: 1600 })).rejects.toMatchObject({ code: "bad_fee" });
    await expect(createExternalOrder({ ...base, toolSlug: "virtual-staging", intakeRaw: { rooms: "[]" }, amountCents: 1500, feeCents: 0 })).rejects.toMatchObject({ code: "invalid_intake" });
    await expect(createExternalOrder({ ...base, toolSlug: "nope", intakeRaw: {}, amountCents: 1500, feeCents: 0 })).rejects.toMatchObject({ code: "unknown_tool" });
  });
});
