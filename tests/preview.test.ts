import { beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { createPreview, watermarkPreview, PREVIEW_LONG_EDGE } from "@/lib/tools/preview";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";
import { track } from "@/lib/analytics/events";
import { computeKpis } from "@/lib/analytics/kpi";

const freshIntake = () => materializeTestIntake(TEST_INTAKES["virtual-staging"]);
const aiRow = (purpose: string, costMicros = 0) => ({ provider: "mock", model: "mock", tier: "standard", purpose, costMicros, latencyMs: 1, ok: true });

describe("free watermarked preview", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("downsizes to 1024 px, tiles the mark over the photo and adds a dark banner (JPEG)", async () => {
    const src = await sharp({ create: { width: 2000, height: 1300, channels: 3, background: "#c8b8a0" } }).jpeg().toBuffer();
    const wm = await watermarkPreview(src);
    expect([wm.width, wm.height]).toEqual([1024, 666]);
    expect((await sharp(wm.data).metadata()).format).toBe("jpeg");
    // stats() reads the input image, so cut the region out first
    const region = async (top: number, height: number) => sharp(await sharp(wm.data).extract({ left: 0, top, width: wm.width, height }).toBuffer()).stats();
    const top = await region(0, wm.height - 60);
    expect(top.channels[0].stdev).toBeGreaterThan(3); // a flat photo is no longer flat: the mark is there
    const banner = await region(wm.height - 14, 12);
    expect(banner.channels[0].mean).toBeLessThan(110);
    expect(top.channels[0].mean).toBeGreaterThan(150); // the photo itself is not darkened
    // tiny photos: the tile is scaled down instead of failing
    const small = await watermarkPreview(await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ffffff" } }).png().toBuffer());
    expect([small.width, small.height]).toEqual([300, 200]);
  });

  it("returns one watermarked version of the visitor's own upload and never attaches it to an order", async () => {
    const intake = await freshIntake();
    const res = await createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "203.0.113.5" });
    expect(res.image.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(Math.max(res.width, res.height)).toBeLessThanOrEqual(PREVIEW_LONG_EDGE);
    expect(res.caption).toContain("watermarked");
    const calls = await prisma.aiRequest.findMany({ where: { purpose: "preview" } });
    expect(calls).toHaveLength(1);
    expect(calls[0].orderId).toBeNull();
    expect(await prisma.event.count({ where: { name: "preview_ready" } })).toBe(1);
    expect((await prisma.file.findUniqueOrThrow({ where: { id: intake.photoFileId as string } })).orderId).toBeNull();
  });

  it("allows FREE_PREVIEWS_PER_IP per day for one visitor", async () => {
    const intake = await freshIntake();
    await createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "203.0.113.9" });
    await createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "203.0.113.9" });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "203.0.113.9" })).rejects.toMatchObject({ code: "preview_ip_limit", status: 429 });
  });

  it("stops at the daily cap, and once previews would eat into the budget paid orders need", async () => {
    const intake = await freshIntake();
    const used = await prisma.aiRequest.count({ where: { purpose: "preview" } });
    await prisma.aiRequest.createMany({ data: Array.from({ length: 15 - used }, () => aiRow("preview")) });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "198.51.100.1" })).rejects.toMatchObject({ code: "preview_quota", status: 429 });
    await prisma.aiRequest.deleteMany({ where: { purpose: "preview" } });

    // 40 % of AI_DAILY_BUDGET_CENTS (500 ¢) = 200 ¢ = 2,000,000 µ$ already spent today on paid work
    await prisma.aiRequest.create({ data: aiRow("stage", 2_000_000) });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "198.51.100.2" })).rejects.toMatchObject({ code: "preview_quota" });
    await prisma.aiRequest.deleteMany({ where: { purpose: "stage" } });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "198.51.100.3" })).resolves.toMatchObject({ width: expect.any(Number) });
  });

  it("admin analytics count previews and the sessions that went on to checkout", async () => {
    await createPreview({ slug: "virtual-staging", intakeRaw: await freshIntake(), ip: "192.0.2.50", sessionId: "sess-preview-1" });
    await createPreview({ slug: "virtual-staging", intakeRaw: await freshIntake(), ip: "192.0.2.51", sessionId: "sess-preview-2" });
    await track("checkout_started", { sessionId: "sess-preview-1" });
    const k = await computeKpis(new Date(Date.now() - 3600_000), new Date(Date.now() + 60_000));
    expect(k.previewsShown).toBeGreaterThanOrEqual(2);
    expect(k.previewSessionsToCheckout).toBe(1);
  });

  it("refuses a photo owned by a paid order, tools without a preview, bad intake and paused tools", async () => {
    const intake = await freshIntake();
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    const order = await prisma.order.create({
      data: { customerEmail: "paid@example.com", toolId: "virtual-staging", productId: product.id, status: "COMPLETED", intake, amountCents: 1500, accessToken: `pv-${Date.now()}` },
    });
    await prisma.file.update({ where: { id: intake.photoFileId as string }, data: { orderId: order.id } });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: intake, ip: "192.0.2.1" })).rejects.toMatchObject({ code: "upload_missing" });

    await expect(createPreview({ slug: "listing-description", intakeRaw: {}, ip: "192.0.2.2" })).rejects.toMatchObject({ code: "no_preview", status: 404 });
    await expect(createPreview({ slug: "virtual-staging", intakeRaw: { roomType: "attic" }, ip: "192.0.2.3" })).rejects.toMatchObject({ code: "invalid_intake" });

    await prisma.tool.update({ where: { id: "virtual-staging" }, data: { status: "PAUSED" } });
    try {
      await expect(createPreview({ slug: "virtual-staging", intakeRaw: await freshIntake(), ip: "192.0.2.4" })).rejects.toMatchObject({ code: "tool_unavailable" });
    } finally {
      await prisma.tool.update({ where: { id: "virtual-staging" }, data: { status: "LIVE" } });
    }
  });
});
