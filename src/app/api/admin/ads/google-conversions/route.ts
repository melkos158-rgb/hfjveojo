import { requireAdminApi } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/errors";
import { googleAdsConversions, googleConversionsCsv, MAX_CLICK_AGE_DAYS } from "@/lib/ads/googleConversions";

export const dynamic = "force-dynamic";

/**
 * Admin: paid orders that came from a Google Ads click, as Google's offline-conversion upload file
 * (Goals → Conversions → Uploads). `?days=` (1–90, default 90) and `?name=` (the conversion action's exact name).
 */
export async function GET(req: Request) {
  try {
    await requireAdminApi();
    const url = new URL(req.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? MAX_CLICK_AGE_DAYS) || MAX_CLICK_AGE_DAYS, 1), MAX_CLICK_AGE_DAYS);
    const name = (url.searchParams.get("name") ?? "").slice(0, 100) || undefined;
    const to = new Date();
    const rows = await googleAdsConversions({ from: new Date(to.getTime() - days * 24 * 3600 * 1000), to, conversionName: name });
    return new Response(googleConversionsCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="google-ads-conversions-${to.toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
