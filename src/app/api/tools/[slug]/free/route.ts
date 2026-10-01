import { cookies } from "next/headers";
import { z } from "zod";
import { freeClaimUrl, requestFreePhoto } from "@/lib/orders/free-photo";
import { errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/security/http";
import { clientIp, hashIp, rateLimit } from "@/lib/security/ratelimit";
import { getSession } from "@/lib/auth/session";
import { ATTRIBUTION_COOKIE, INTERNAL_COOKIE, SESSION_ID_COOKIE, isInternalVisitor, parseAttributionCookie } from "@/lib/analytics/events";
import { env } from "@/lib/env";

const bodySchema = z.object({ email: z.string().min(3).max(200), intake: z.record(z.string(), z.unknown()) });

/** Intake (one photo) + email → PENDING free order and a confirmation email; the click on its link starts the staging. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const ip = clientIp(req); // only ever stored as a keyed hash
    await rateLimit({ key: `free-req:${hashIp(ip)}`, limit: 10, windowSeconds: 600 });
    const body = bodySchema.parse(await readJsonBody(req));
    const store = await cookies();
    const session = await getSession();
    const result = await requestFreePhoto({
      toolSlug: slug,
      email: body.email,
      intakeRaw: body.intake,
      ip,
      attribution: parseAttributionCookie(store.get(ATTRIBUTION_COOKIE)?.value),
      userId: session?.id ?? null,
      sessionId: store.get(SESSION_ID_COOKIE)?.value ?? null,
      internal: isInternalVisitor(store.get(INTERNAL_COOKIE)?.value, session?.role),
    });
    // Local development without an email provider: hand the link back so the flow can be tested end to end.
    const e = env();
    const devLink = e.APP_ENV !== "production" && (e.EMAIL_PROVIDER === "console" || !e.RESEND_API_KEY) ? freeClaimUrl(result.orderId) : undefined;
    return Response.json({ ok: true, email: result.email, ...(devLink ? { devLink } : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Please check the form fields" }, { status: 400 });
    return errorResponse(err);
  }
}
