import { resumeCheckout } from "@/lib/orders/create";
import { rateLimit, ipHash } from "@/lib/security/ratelimit";
import { appUrl } from "@/lib/env";
import { log } from "@/lib/logger";

/**
 * "Finish your order" (cancel page, reminder email): the same order in a new Stripe Checkout session, or its order page
 * when it is already paid, or the order form when it can't be resumed any more. Always a redirect, never an error page.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t");
  try {
    await rateLimit({ key: `resume:${ipHash(req)}`, limit: 10, windowSeconds: 600 });
    const { url } = await resumeCheckout(id, t);
    return Response.redirect(url, 303);
  } catch (err) {
    log.warn("orders.resume_failed", { orderId: id, error: (err as Error).message });
    return Response.redirect(appUrl("/tools"), 303);
  }
}
