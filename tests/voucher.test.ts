import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent } = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string }> }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { signPayload } from "@/lib/security/tokens";
import { computeKpis } from "@/lib/analytics/kpi";
import { freePhotoAvailability } from "@/lib/orders/free-photo";
import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";
import { deliverOrder } from "@/lib/orders/service";
import { checkVoucher, descriptionVoucherUrl, isFreePhotoOrder, isVoucherOrder, orderHasVoucher, redeemDescriptionVoucher, voucherToken } from "@/lib/orders/voucher";

const STAGING_INTAKE = { rooms: [{ photoFileId: "f1", roomType: "living room" }], style: "modern", notes: "" };
let seq = 0;

async function stagingOrder(over: { status?: "PENDING" | "PAID" | "COMPLETED" | "REFUNDED"; extra?: boolean; free?: boolean } = {}) {
  const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
  const status = over.status ?? "COMPLETED";
  return prisma.order.create({
    data: {
      customerEmail: "agent@example.com",
      toolId: "virtual-staging",
      productId: product.id,
      status,
      paidAt: status === "PENDING" ? null : new Date(),
      intake: { ...STAGING_INTAKE, ...(over.extra === false ? {} : { extraIncluded: true }) },
      amountCents: over.free ? 0 : 4900,
      free: over.free ?? false,
      quantity: 4,
      accessToken: `voucher-${seq++}-${Date.now()}`,
    },
  });
}

describe("MLS description included with a staging Listing Pack (voucher)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("turns a paid pack order's voucher into one free description order, exactly once", async () => {
    const source = await stagingOrder();
    expect(orderHasVoucher(source)).toBe(true);
    expect(new URL(descriptionVoucherUrl(source.id)).pathname).toBe("/tools/listing-description");
    const token = voucherToken(source.id);
    expect(await checkVoucher(token)).toEqual({ ok: true, sourceOrderId: source.id, email: "agent@example.com" });

    const res = await redeemDescriptionVoucher({ token, email: "Agent@Example.com", intakeRaw: TEST_INTAKES["listing-description"] });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.orderId } });
    // paid on creation and queued at once (tests run jobs inline, so it may already be delivered)
    expect(order).toMatchObject({ toolId: "listing-description", free: true, amountCents: 0, freeKey: `desc:${source.id}`, customerEmail: "agent@example.com" });
    expect(order.paidAt).not.toBeNull();
    expect(["PAID", "PROCESSING", "COMPLETED"]).toContain(order.status);
    expect(order.intake).toMatchObject({ includedWith: source.id });
    expect(isVoucherOrder(order)).toBe(true);
    expect(isFreePhotoOrder(order)).toBe(false);
    expect(res.checkoutUrl).toContain(`/orders/${order.id}?t=`);
    expect(await prisma.job.count({ where: { orderId: order.id, type: "fulfill_order" } })).toBe(1);

    await expect(redeemDescriptionVoucher({ token, email: "agent@example.com", intakeRaw: TEST_INTAKES["listing-description"] })).rejects.toMatchObject({ code: "voucher_used" });
    expect(await checkVoucher(token)).toEqual({ ok: false, problem: "used" });
  });

  it("refuses unpaid, plain, free and forged sources", async () => {
    const pending = await stagingOrder({ status: "PENDING" });
    expect(await checkVoucher(voucherToken(pending.id))).toEqual({ ok: false, problem: "unpaid" });
    const refunded = await stagingOrder({ status: "REFUNDED" });
    expect(await checkVoucher(voucherToken(refunded.id))).toEqual({ ok: false, problem: "unpaid" });
    const plain = await stagingOrder({ extra: false });
    expect(await checkVoucher(voucherToken(plain.id))).toEqual({ ok: false, problem: "invalid" });
    const free = await stagingOrder({ free: true });
    expect(await checkVoucher(voucherToken(free.id))).toEqual({ ok: false, problem: "invalid" });
    const paid = await stagingOrder();
    expect(await checkVoucher(signPayload({ o: paid.id, k: "free" }, 3600))).toEqual({ ok: false, problem: "invalid" });
    expect(await checkVoucher("not-a-token")).toEqual({ ok: false, problem: "invalid" });
    expect(await checkVoucher(null)).toEqual({ ok: false, problem: "invalid" });
    await expect(redeemDescriptionVoucher({ token: voucherToken(pending.id), email: "agent@example.com", intakeRaw: TEST_INTAKES["listing-description"] })).rejects.toMatchObject({ code: "voucher_unpaid" });
  });

  it("puts the voucher link in the delivery email of a pack order, and not in a plain order's", async () => {
    const pack = await stagingOrder({ status: "PAID" });
    await deliverOrder(pack.id, { by: "system" });
    expect(sent.at(-1)?.text).toContain("Your MLS listing description is included");
    expect(sent.at(-1)?.text).toContain("/tools/listing-description?voucher=");
    const plain = await stagingOrder({ status: "PAID", extra: false });
    await deliverOrder(plain.id, { by: "system" });
    expect(sent.at(-1)?.text).not.toContain("voucher=");
  });

  it("keeps included descriptions out of the free-photo numbers", async () => {
    const before = await computeKpis(new Date(Date.now() - 24 * 3600 * 1000), new Date(Date.now() + 60_000));
    const source = await stagingOrder();
    await redeemDescriptionVoucher({ token: voucherToken(source.id), email: "agent@example.com", intakeRaw: TEST_INTAKES["listing-description"] });
    const after = await computeKpis(new Date(Date.now() - 24 * 3600 * 1000), new Date(Date.now() + 60_000));
    expect(after.freePhotosClaimed).toBe(before.freePhotosClaimed);
    expect(after.paidOrders).toBe(before.paidOrders);
    expect((await freePhotoAvailability()).available).toBe(true);
  });
});
