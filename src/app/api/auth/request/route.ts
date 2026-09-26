import { z } from "zod";
import { issueMagicLink } from "@/lib/auth/magic";
import { errorResponse, reportError, AppError } from "@/lib/errors";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { env } from "@/lib/env";
import { googleEnabled } from "@/lib/auth/google";
import { readJsonBody } from "@/lib/security/http";

const schema = z.object({ email: z.email(), next: z.string().max(200).optional() });

export async function POST(req: Request) {
  try {
    await rateLimit({ key: `auth:${clientIp(req)}`, limit: 5, windowSeconds: 600 });
    const body = schema.parse(await readJsonBody(req));
    await rateLimit({ key: `auth:email:${body.email.toLowerCase()}`, limit: 3, windowSeconds: 600 });
    let url: string;
    try {
      ({ url } = await issueMagicLink(body.email, body.next));
    } catch (err) {
      // The link is issued; only the email failed (e.g. mail domain not verified yet). Say so instead of a bare 500.
      void reportError(err, { route: "auth.request" });
      throw new AppError(
        googleEnabled()
          ? "We could not send the email right now. Use “Continue with Google” or try again in a few minutes."
          : "We could not send the email right now. Please try again in a few minutes.",
        503,
        "email_unavailable",
      );
    }
    const e = env();
    const devLink = e.APP_ENV !== "production" && (e.EMAIL_PROVIDER === "console" || !e.RESEND_API_KEY) ? url : undefined;
    return Response.json({ ok: true, ...(devLink ? { devLink } : {}) });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Enter a valid email" }, { status: 400 });
    return errorResponse(err);
  }
}
