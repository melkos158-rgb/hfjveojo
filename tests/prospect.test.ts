import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent } = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string }> }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));
vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` })),
      },
    },
  };
  return { stripe: () => fake };
});

import { prisma } from "@/lib/db";
import { createProspectPreview, recentProspectPreviews } from "@/lib/orders/prospect";
import { isProspectPreview, NOT_PROSPECT_PREVIEW, prospectOf } from "@/lib/orders/prospect-rules";
import { isFreePhotoOrder } from "@/lib/orders/voucher";
import { checkFinish, finishUrl } from "@/lib/orders/finish";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { freePhotoAvailability } from "@/lib/orders/free-photo";
import { computeKpis } from "@/lib/analytics/kpi";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { env } from "@/lib/env";
import { resetDatabase } from "./helpers";

const PHOTO = "@file:img/sample-staging-before.jpg";
const roomsOf = async (n: number) => (await materializeTestIntake({ rooms: Array.from({ length: n }, () => ({ photoFileId: PHOTO, roomType: "living room" })), style: "coastal", notes: "" })).rooms;
const intakeOf = async (n: number) => ({ rooms: JSON.stringify(await roomsOf(n)), style: "coastal" });

describe("prospect previews (court lever 2): a prospect's own room on a private page, after their yes", () => {
  let adminId = "";
  const adminEmail = "admin@example.com";
  beforeAll(async () => {
    await resetDatabase();
    adminId = (await prisma.user.create({ data: { email: adminEmail, role: "ADMIN" } })).id;
  });

  it("stages one room for $0 through the normal pipeline and emails the admin the link to send", async () => {
    const { orderId, accessToken } = await createProspectPreview({ intakeRaw: await intakeOf(1), prospect: "  @tampa_agent ", adminId, adminEmail });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: true, payments: true } });
    expect(order.status).toBe("COMPLETED"); // inline jobs: the pipeline ran
    expect([order.free, order.amountCents, order.quantity, order.customerEmail, order.accessToken]).toEqual([true, 0, 1, adminEmail, accessToken]);
    expect(order.freeKey).toMatch(/^prospect:/);
    expect(order.payments).toEqual([]);
    expect(isProspectPreview(order)).toBe(true);
    expect(isFreePhotoOrder(order)).toBe(false);
    expect(prospectOf(order)).toBe("@tampa_agent");
    expect(order.outputs.filter((o) => o.type === "IMAGE").length).toBe(4); // 2 versions + 2 labeled
    expect(await prisma.adminAction.count({ where: { action: "prospect_preview", targetId: orderId } })).toBe(1);

    const mail = sent.find((m) => m.subject === "Preview for @tampa_agent is ready");
    expect(mail?.to).toBe(adminEmail);
    expect(mail?.text).toContain(`/orders/${orderId}?t=${encodeURIComponent(accessToken)}`);
    expect(mail?.text).toContain("Reply to paste (EN):");
    expect(mail?.text).toContain("UA (для перевірки, не надсилати):");
    expect(sent.some((m) => m.subject === "Your free staged photo is ready")).toBe(false);
  });

  it("is not a free first photo: no daily allowance used, not counted, and the dashboard filter keeps other orders", async () => {
    const before = await prisma.order.count({ where: { free: true, freeKey: { startsWith: "prospect:" } } });
    expect(before).toBe(1);
    expect((await freePhotoAvailability()).available).toBe(env().FREE_PHOTOS_PER_DAY > 0);
    const k = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    expect([k.freePhotosClaimed, k.prospectPreviews, k.prospectPreviewsFinished, k.ordersPaid, k.revenueCents]).toEqual([0, 1, 0, 0, 0]);

    // An ordinary order of the same email (freeKey null) stays visible; the preview does not.
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    await prisma.order.create({ data: { customerEmail: adminEmail, toolId: "virtual-staging", productId: product.id, intake: {}, amountCents: 1500, accessToken: "own-order-token" } });
    const mine = await prisma.order.findMany({ where: { customerEmail: adminEmail, AND: [NOT_PROSPECT_PREVIEW] }, select: { freeKey: true } });
    expect(mine.map((o) => o.freeKey)).toEqual([null]);
  });

  it("offers Finish this listing for 7 days without prefilling the admin's email", async () => {
    const preview = await prisma.order.findFirstOrThrow({ where: { freeKey: { startsWith: "prospect:" } } });
    const url = finishUrl(preview.id, preview.deliveredAt);
    const token = new URL(url as string).searchParams.get("finish") as string;
    expect(await checkFinish(token)).toEqual({ ok: true, freeOrderId: preview.id, style: "coastal", email: null });

    const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: await intakeOf(4), finish: token });
    const finish = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect([finish.amountCents, finish.quantity, finish.customerEmail]).toEqual([3900, 4, "agent@example.com"]);
    expect(finish.intake).toMatchObject({ finishOf: preview.id, extraIncluded: true });

    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: new Date() } });
    const rows = await recentProspectPreviews();
    expect(rows.map((r) => [r.prospect, r.finishedPaid])).toEqual([["@tampa_agent", 1]]);
    const k = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    expect([k.prospectPreviews, k.prospectPreviewsFinished]).toEqual([1, 1]);
  });

  it("refuses more than one room, a missing or long name, and a photo another order already used", async () => {
    const base = { adminId, adminEmail };
    await expect(createProspectPreview({ ...base, intakeRaw: await intakeOf(2), prospect: "@x" })).rejects.toMatchObject({ code: "preview_one_photo" });
    await expect(createProspectPreview({ ...base, intakeRaw: await intakeOf(1), prospect: "   " })).rejects.toMatchObject({ code: "prospect_missing" });
    await expect(createProspectPreview({ ...base, intakeRaw: await intakeOf(1), prospect: "x".repeat(81) })).rejects.toMatchObject({ code: "prospect_too_long" });
    const used = await prisma.order.findFirstOrThrow({ where: { freeKey: { startsWith: "prospect:" } } });
    await expect(createProspectPreview({ ...base, intakeRaw: { rooms: JSON.stringify((used.intake as { rooms: unknown[] }).rooms), style: "coastal" }, prospect: "@again" })).rejects.toMatchObject({
      code: "upload_missing",
    });
  });
});
