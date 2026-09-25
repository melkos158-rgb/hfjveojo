import { cookies } from "next/headers";
import { z } from "zod";
import { track, ATTRIBUTION_COOKIE, SESSION_ID_COOKIE, parseAttributionCookie } from "@/lib/analytics/events";
import { getSession } from "@/lib/auth/session";
import { ipHash } from "@/lib/security/ratelimit";

const schema = z.object({
  name: z.string().regex(/^[a-z_]{2,40}$/),
  path: z.string().max(200).optional().nullable(),
  referrer: z.string().max(300).optional().nullable(),
  props: z.record(z.string(), z.unknown()).optional(),
});

/** First-party analytics beacon. Accepts a small allow-listed set of client events. */
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    if (!["page_view", "cta_click", "intake_started", "faq_open"].includes(body.name)) return Response.json({ ok: true });
    const store = await cookies();
    const session = await getSession();
    await track(body.name, {
      sessionId: store.get(SESSION_ID_COOKIE)?.value,
      userId: session?.id,
      path: body.path ?? undefined,
      referrer: body.referrer ?? undefined,
      utm: parseAttributionCookie(store.get(ATTRIBUTION_COOKIE)?.value),
      props: body.props,
      ipHash: ipHash(req),
      userAgent: req.headers.get("user-agent"),
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
