import { z } from "zod";
import { issueMagicLink } from "@/lib/auth/magic";
import { errorResponse } from "@/lib/errors";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { env } from "@/lib/env";

const schema = z.object({ email: z.email(), next: z.string().max(200).optional() });

export async function POST(req: Request) {
  try {
    await rateLimit({ key: `auth:${clientIp(req)}`, limit: 5, windowSeconds: 600 });
    const body = schema.parse(await req.json());
    await rateLimit({ key: `auth:email:${body.email.toLowerCase()}`, limit: 3, windowSeconds: 600 });
    const { url } = await issueMagicLink(body.email, body.next);
    const e = env();
    const devLink = e.APP_ENV !== "production" && (e.EMAIL_PROVIDER === "console" || !e.RESEND_API_KEY) ? url : undefined;
    return Response.json({ ok: true, ...(devLink ? { devLink } : {}) });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Enter a valid email" }, { status: 400 });
    return errorResponse(err);
  }
}
