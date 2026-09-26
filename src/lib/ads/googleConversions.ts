import { prisma } from "@/lib/db";
import type { Attribution } from "@/lib/analytics/attribution";

/**
 * Report real sales back to Google Ads as offline click conversions, so the Ads account shows which clicks turned
 * into paid orders. The paid order is the only conversion that matters (not clicks, not checkouts).
 *
 * How: the middleware keeps the Google click id (gclid) from the ad's landing URL in the first-party attribution
 * cookie, the order stores it, and /api/admin/ads/google-conversions exports Google's upload template. In Google Ads:
 * Goals → Conversions → Summary → + New conversion action → Import → "CRMs, files or other data sources" → "Track
 * conversions from clicks", named exactly DEFAULT_CONVERSION_NAME, then upload the CSV under Goals → Conversions →
 * Uploads. No Google cookies or tags on the site are needed for this.
 */

export const DEFAULT_CONVERSION_NAME = "ORVIONIS paid order";

/** Google accepts clicks up to 90 days old. */
export const MAX_CLICK_AGE_DAYS = 90;

export type GoogleConversionRow = {
  orderId: string;
  gclid: string;
  conversionName: string;
  conversionTime: Date;
  /** In the order's currency, major units. */
  value: number;
  currency: string;
};

/** Paid, non-test, non-refunded orders with a Google click id whose payment falls in [from, to). */
export async function googleAdsConversions(opts: { from: Date; to: Date; conversionName?: string }): Promise<GoogleConversionRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      isTest: false,
      paidAt: { gte: opts.from, lt: opts.to },
      status: { notIn: ["PENDING", "CANCELED", "REFUNDED"] },
    },
    select: { id: true, paidAt: true, amountCents: true, currency: true, attribution: true },
    orderBy: { paidAt: "asc" },
  });
  const oldest = Date.now() - MAX_CLICK_AGE_DAYS * 24 * 3600 * 1000;
  const rows: GoogleConversionRow[] = [];
  for (const o of orders) {
    const a = (o.attribution ?? {}) as Attribution;
    if (!a.gclid || !o.paidAt) continue;
    const clickAt = a.clickAt ? Date.parse(a.clickAt) : NaN;
    // Google rejects conversions older than the click window or earlier than the click itself.
    if (Number.isFinite(clickAt) && (clickAt < oldest || clickAt > o.paidAt.getTime())) continue;
    rows.push({
      orderId: o.id,
      gclid: a.gclid,
      conversionName: opts.conversionName?.trim() || DEFAULT_CONVERSION_NAME,
      conversionTime: o.paidAt,
      value: o.amountCents / 100,
      currency: o.currency.toUpperCase(),
    });
  }
  return rows;
}

/** "yyyy-MM-dd HH:mm:ss" in UTC (the file declares TimeZone=+0000). */
export function formatGoogleTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Google Ads "conversions from clicks" upload template. */
export function googleConversionsCsv(rows: GoogleConversionRow[]): string {
  const lines = ["Parameters:TimeZone=+0000", "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency"];
  for (const r of rows) {
    lines.push([csvCell(r.gclid), csvCell(r.conversionName), formatGoogleTime(r.conversionTime), r.value.toFixed(2), r.currency].join(","));
  }
  return `${lines.join("\n")}\n`;
}
