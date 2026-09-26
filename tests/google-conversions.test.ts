import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { formatGoogleTime, googleAdsConversions, googleConversionsCsv } from "@/lib/ads/googleConversions";
import { resetDatabase } from "./helpers";

const GCLID = "Cj0KCQjw2t3VBhDcARIsAB_test-click_2";

describe("Google Ads offline conversions", () => {
  beforeAll(async () => {
    await resetDatabase();
    const tool = await prisma.tool.findFirstOrThrow({ where: { slug: "virtual-staging" } });
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: tool.id, active: true } });
    const base = { customerEmail: "buyer@example.com", toolId: tool.id, productId: product.id, intake: {}, currency: "usd" };
    const clickAt = new Date(Date.now() - 2 * 3600_000);
    const paidAt = new Date(Date.now() - 3600_000);
    let n = 0;
    const mk = (over: Record<string, unknown>) => prisma.order.create({ data: { ...base, accessToken: `tok_${n++}`, amountCents: 3000, status: "COMPLETED", paidAt, ...over } as never });
    await mk({ attribution: { utm_source: "google", gclid: GCLID, clickAt: clickAt.toISOString() } }); // counts
    await mk({ attribution: { utm_source: "google", gclid: "Cj0KCQjw_refunded_click_3", clickAt: clickAt.toISOString() }, status: "REFUNDED" }); // refunded: no
    await mk({ attribution: { utm_source: "google", gclid: "Cj0KCQjw_test_order_click4" }, isTest: true }); // pipeline test: no
    await mk({ attribution: { utm_source: "instagram_dm" } }); // not from an ad: no
    await mk({ attribution: { gclid: "Cj0KCQjw_unpaid_click_555" }, status: "PENDING", paidAt: null }); // unpaid: no
    await mk({ attribution: { gclid: "Cj0KCQjw_before_click_666", clickAt: new Date(Date.now() - 1800_000).toISOString() } }); // paid before the click: no
  });

  it("exports only real paid sales from ad clicks, in Google's upload template", async () => {
    const rows = await googleAdsConversions({ from: new Date(Date.now() - 86400_000), to: new Date() });
    expect(rows.map((r) => r.gclid)).toEqual([GCLID]);
    expect(rows[0]).toMatchObject({ conversionName: "ORVIONIS paid order", value: 30, currency: "USD" });

    const csv = googleConversionsCsv(rows).split("\n");
    expect(csv[0]).toBe("Parameters:TimeZone=+0000");
    expect(csv[1]).toBe("Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency");
    expect(csv[2]).toBe(`${GCLID},ORVIONIS paid order,${formatGoogleTime(rows[0].conversionTime)},30.00,USD`);
    expect(formatGoogleTime(new Date("2026-09-26T18:05:09.123Z"))).toBe("2026-09-26 18:05:09");
  });

  it("uses the conversion action name the admin passes, quoted when needed", async () => {
    const rows = await googleAdsConversions({ from: new Date(Date.now() - 86400_000), to: new Date(), conversionName: "Purchase, staging" });
    expect(googleConversionsCsv(rows)).toContain(`${GCLID},"Purchase, staging",`);
  });
});
