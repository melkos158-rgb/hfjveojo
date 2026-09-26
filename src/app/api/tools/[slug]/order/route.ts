import { cookies } from "next/headers";
import { z } from "zod";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/security/http";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { getSession } from "@/lib/auth/session";
import { ATTRIBUTION_COOKIE, SESSION_ID_COOKIE, parseAttributionCookie } from "@/lib/analytics/events";
import { isAdmin } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors";

const bodySchema = z.object({ email: z.string().min(3).max(200), intake: z.record(z.string(), z.unknown()), sandbox: z.boolean().optional() });

/** Intake → PENDING order → Stripe Checkout URL. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    await rateLimit({ key: `order:${clientIp(req)}`, limit: 10, windowSeconds: 600 });
    const body = bodySchema.parse(await readJsonBody(req));
    const store = await cookies();
    const session = await getSession();
    // Admins can take a real sandbox checkout (test card, no money) through the live site to test the whole flow.
    if (body.sandbox && !isAdmin(session)) throw new AppError("Sandbox checkout is for admins only", 403, "forbidden");
    const result = await createOrderWithCheckout({
      toolSlug: slug,
      email: body.email,
      intakeRaw: body.intake,
      attribution: parseAttributionCookie(store.get(ATTRIBUTION_COOKIE)?.value),
      userId: session?.id ?? null,
      sessionId: store.get(SESSION_ID_COOKIE)?.value ?? null,
      ...(body.sandbox ? { mode: "test" as const, isTest: true } : {}),
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Please check the form fields" }, { status: 400 });
    return errorResponse(err);
  }
}
