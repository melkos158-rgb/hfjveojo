import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security/tokens";
import { generateCeoReport } from "@/lib/ceo/report";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Called by a scheduler (Railway cron, GitHub Actions, or the worker) with Authorization: Bearer CRON_SECRET. */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${env().CRON_SECRET}`)) return new Response("Unauthorized", { status: 401 });
  try {
    const period = new URL(req.url).searchParams.get("period") === "WEEKLY" ? "WEEKLY" : "DAILY";
    const r = await generateCeoReport(period);
    return Response.json({ ok: true, ...r });
  } catch (err) {
    return errorResponse(err);
  }
}
