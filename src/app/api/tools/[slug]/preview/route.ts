import { cookies } from "next/headers";
import { z } from "zod";
import { createPreview } from "@/lib/tools/preview";
import { errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/security/http";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { INTERNAL_COOKIE, SESSION_ID_COOKIE, isInternalVisitor } from "@/lib/analytics/events";
import { getSession } from "@/lib/auth/session";

const bodySchema = z.object({ intake: z.record(z.string(), z.unknown()) });

/** Intake (with an uploaded photo) → one watermarked preview image as a data URL. Capped per IP and per day. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const ip = clientIp(req);
    await rateLimit({ key: `preview-req:${ip}`, limit: 10, windowSeconds: 600 });
    const body = bodySchema.parse(await readJsonBody(req));
    const store = await cookies();
    const internal = isInternalVisitor(store.get(INTERNAL_COOKIE)?.value, (await getSession())?.role);
    const result = await createPreview({ slug, intakeRaw: body.intake, ip, sessionId: store.get(SESSION_ID_COOKIE)?.value ?? null, internal });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Please check the form fields" }, { status: 400 });
    return errorResponse(err);
  }
}
