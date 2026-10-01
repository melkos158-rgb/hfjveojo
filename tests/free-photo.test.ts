import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { claimFreePhoto, freeClaimUrl, freeKeyOf, freePhotoAvailability, isDisposableEmail, requestFreePhoto } from "@/lib/orders/free-photo";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";
import { computeKpis } from "@/lib/analytics/kpi";
import { googleAdsConversions } from "@/lib/ads/googleConversions";
import { signPayload } from "@/lib/security/tokens";
import { GET as claimRoute } from "@/app/api/free/claim/route";

const freshIntake = () => materializeTestIntake(TEST_INTAKES["virtual-staging"]);
const aiRow = (purpose: string, costMicros = 0) => ({ provider: "mock", model: "mock", tier: "standard", purpose, costMicros, latencyMs: 1, ok: true });
let ipSeq = 0;
const nextIp = () => `203.0.113.${(ipSeq++ % 250) + 1}`;
const tokenOf = (orderId: string) => new URL(freeClaimUrl(orderId)).searchParams.get("t") as string;

async function request(email: string, intake?: Record<string, unknown>, ip = nextIp()) {
  return requestFreePhoto({ toolSlug: "virtual-staging", email, intakeRaw: intake ?? (await freshIntake()), ip });
}

describe("free first photo: who counts as the same person", () => {
  it("normalises case, +tags and Gmail dots, and treats googlemail.com as gmail.com", () => {
    expect(freeKeyOf(" Jane.Doe+listing@GMAIL.com ")).toBe("janedoe@gmail.com");
    expect(freeKeyOf("jane.doe@googlemail.com")).toBe("janedoe@gmail.com");
    expect(freeKeyOf("Jane.Doe+x@brokerage.com")).toBe("jane.doe@brokerage.com");
    expect(freeKeyOf("agent@kw.com")).toBe("agent@kw.com");
  });

  it("recognises throwaway inboxes", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@YOPMAIL.com")).toBe(true);
    expect(isDisposableEmail("agent@compass.com")).toBe(false);
  });
});

describe("free first photo: request → email link → staged order", () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  beforeEach(async () => {
    await prisma.aiRequest.deleteMany({});
    await prisma.rateLimit.deleteMany({});
  });

  it("creates a PENDING $0 order that runs nothing until the emailed link is clicked", async () => {
    const intake = await freshIntake();
    const { orderId, email } = await request("New.Agent@Example.com", intake);
    expect(email).toBe("new.agent@example.com");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order).toMatchObject({ status: "PENDING", free: true, amountCents: 0, quantity: 1, freeKey: null, isTest: false });
    expect(await prisma.job.count({ where: { orderId } })).toBe(0);
    const photo = await prisma.file.findUniqueOrThrow({ where: { id: (intake.rooms as Array<{ photoFileId: string }>)[0].photoFileId } });
    expect(photo.orderId).toBe(orderId);
    expect(await prisma.event.count({ where: { name: "free_photo_requested", orderId } })).toBe(1);
  });

  it("the link claims it once: PAID for $0, freeKey set, the pipeline delivers two versions", async () => {
    const { orderId } = await request("claimer@example.com");
    const first = await claimFreePhoto(orderId, tokenOf(orderId));
    expect(first.outcome).toBe("claimed");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: true } });
    expect(order.freeKey).toBe("claimer@example.com");
    expect(order.paidAt).not.toBeNull();
    expect(order.userId).not.toBeNull();
    // JOBS_INLINE: the mock pipeline ran and delivered
    expect(order.status).toBe("COMPLETED");
    expect(order.outputs.filter((o) => o.type === "IMAGE").length).toBeGreaterThanOrEqual(2);
    // a second click just opens the order page
    expect((await claimFreePhoto(orderId, tokenOf(orderId))).outcome).toBe("already");
    expect(await prisma.event.count({ where: { name: "free_photo_claimed", orderId } })).toBe(1);
  });

  it("one per person: the same inbox under another spelling can't get a second one", async () => {
    await expect(request("claimer+2@example.com")).rejects.toMatchObject({ code: "free_used", status: 409 });
    const gmail = await request("Real.Person@gmail.com");
    expect((await claimFreePhoto(gmail.orderId, tokenOf(gmail.orderId))).outcome).toBe("claimed");
    await expect(request("realperson@googlemail.com")).rejects.toMatchObject({ code: "free_used" });
  });

  it("two pending requests of one person: the first click wins, the second link closes its order", async () => {
    const a = await request("twice@example.com");
    const b = await request("twice+b@example.com"); // another spelling, so it doesn't replace the first
    expect((await claimFreePhoto(a.orderId, tokenOf(a.orderId))).outcome).toBe("claimed");
    expect((await claimFreePhoto(b.orderId, tokenOf(b.orderId))).outcome).toBe("used");
    const closed = await prisma.order.findUniqueOrThrow({ where: { id: b.orderId } });
    expect(closed.status).toBe("CANCELED");
    expect(closed.freeKey).toBeNull();
    expect((await claimFreePhoto(b.orderId, tokenOf(b.orderId))).outcome).toBe("used");
  });

  it("a newer request of the same address replaces the unconfirmed older one", async () => {
    const old = await request("again@example.com");
    const fresh = await request("again@example.com");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: old.orderId } })).status).toBe("CANCELED");
    expect((await claimFreePhoto(old.orderId, tokenOf(old.orderId))).outcome).toBe("canceled");
    expect((await claimFreePhoto(fresh.orderId, tokenOf(fresh.orderId))).outcome).toBe("claimed");
  });

  it("refuses forged or foreign links", async () => {
    const { orderId } = await request("forged@example.com");
    expect((await claimFreePhoto(orderId, "nope.nope")).outcome).toBe("invalid");
    const other = await request("other-person@example.com");
    expect((await claimFreePhoto(orderId, tokenOf(other.orderId))).outcome).toBe("invalid");
    expect((await claimFreePhoto(orderId, signPayload({ o: orderId, k: "download" }, 600))).outcome).toBe("invalid");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
  });

  it("only one photo, no throwaway inboxes, a valid email", async () => {
    const intake = await freshIntake();
    const second = await freshIntake();
    const two = { ...intake, rooms: [...(intake.rooms as unknown[]), ...(second.rooms as unknown[])] };
    await expect(request("two-photos@example.com", two)).rejects.toMatchObject({ code: "free_one_photo" });
    await expect(request("someone@mailinator.com")).rejects.toMatchObject({ code: "disposable_email" });
    await expect(request("not-an-email")).rejects.toMatchObject({ code: "invalid_email" });
  });

  it("limits requests per IP and per person", async () => {
    const ip = "198.51.100.77";
    await request("ip-a@example.com", undefined, ip);
    await request("ip-b@example.com", undefined, ip);
    await expect(request("ip-c@example.com", undefined, ip)).rejects.toMatchObject({ code: "free_rate_limited", status: 429 });
    await request("same@example.com");
    await request("same@example.com");
    await request("same@example.com");
    await expect(request("same@example.com")).rejects.toMatchObject({ code: "free_rate_limited" });
  });

  it("stops at the daily cap and before free photos eat into the budget paid orders need", async () => {
    const claimedToday = await prisma.order.count({ where: { free: true, paidAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } } });
    expect(claimedToday).toBeGreaterThan(0);
    const pending = await request("before-cap@example.com");
    // Fill the day: FREE_PHOTOS_PER_DAY defaults to 10.
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    for (let i = claimedToday; i < 10; i++) {
      await prisma.order.create({
        data: {
          free: true, freeKey: `filler${i}@example.com`, status: "COMPLETED", paidAt: new Date(), customerEmail: `filler${i}@example.com`,
          toolId: "virtual-staging", productId: product.id, intake: {}, amountCents: 0, accessToken: `filler-${i}-token`,
        },
      });
    }
    expect(await freePhotoAvailability()).toEqual({ available: false, reason: "sold_out" });
    await expect(request("after-cap@example.com")).rejects.toMatchObject({ code: "free_sold_out" });
    // a link clicked on a sold-out day keeps its order for the next day
    expect((await claimFreePhoto(pending.orderId, tokenOf(pending.orderId))).outcome).toBe("sold_out");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: pending.orderId } })).status).toBe("PENDING");
    await prisma.order.deleteMany({ where: { freeKey: { startsWith: "filler" } } });

    // 50 % of AI_DAILY_BUDGET_CENTS (500 ¢) = 2,500,000 µ$ already spent today
    await prisma.aiRequest.create({ data: aiRow("stage", 2_500_000) });
    expect((await freePhotoAvailability()).available).toBe(false);
    await prisma.aiRequest.deleteMany({});
    expect((await freePhotoAvailability()).available).toBe(true);
  });

  it("free photos are not revenue, paid orders or Google Ads conversions", async () => {
    const from = new Date(Date.now() - 3600_000);
    const to = new Date(Date.now() + 60_000);
    const { orderId } = await request("kpi@example.com");
    await prisma.order.update({ where: { id: orderId }, data: { attribution: { gclid: "Cj0KCQjwfreephotoGclid123" } } });
    expect((await claimFreePhoto(orderId, tokenOf(orderId))).outcome).toBe("claimed");
    const k = await computeKpis(from, to);
    expect(k.ordersPaid).toBe(0);
    expect(k.revenueCents).toBe(0);
    expect(k.customers).toBe(0);
    expect(k.freePhotosClaimed).toBeGreaterThanOrEqual(1);
    expect(await googleAdsConversions({ from, to })).toEqual([]);
  });

  it("the email link route lands on the order page, or back on the tool page with the reason", async () => {
    const { orderId } = await request("route@example.com");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const ok = await claimRoute(new Request(freeClaimUrl(orderId)));
    expect(ok.status).toBe(307);
    expect(ok.headers.get("location")).toContain(`/orders/${orderId}?t=${encodeURIComponent(order.accessToken)}&free=1`);
    const bad = await claimRoute(new Request(`http://localhost:3000/api/free/claim?o=${orderId}&t=forged`));
    expect(bad.headers.get("location")).toContain("/tools/virtual-staging?free=invalid");
  });

  it("hourly maintenance keeps an unconfirmed free photo for the life of its link, then closes it", async () => {
    const { orderId } = await request("slow-reader@example.com");
    const { runJob } = await import("@/lib/jobs/runner");
    const maintain = async () => {
      const job = await prisma.job.create({ data: { type: "maintenance", payload: {} } });
      await runJob(job.id, "test-worker");
    };
    await prisma.order.update({ where: { id: orderId }, data: { createdAt: new Date(Date.now() - 3 * 24 * 3600_000) } });
    await maintain();
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    expect((await claimFreePhoto(orderId, tokenOf(orderId))).outcome).toBe("claimed"); // day 3: the link still works

    const late = await request("too-late@example.com");
    await prisma.order.update({ where: { id: late.orderId }, data: { createdAt: new Date(Date.now() - 8 * 24 * 3600_000) } });
    await maintain();
    expect((await prisma.order.findUniqueOrThrow({ where: { id: late.orderId } })).status).toBe("CANCELED");
    expect((await claimFreePhoto(late.orderId, tokenOf(late.orderId))).outcome).toBe("canceled");
  });
});
