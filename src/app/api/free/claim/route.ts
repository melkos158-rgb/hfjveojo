import { NextResponse } from "next/server";
import { claimFreePhoto, type FreeClaimOutcome } from "@/lib/orders/free-photo";
import { appUrl } from "@/lib/env";
import { reportError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** Where each outcome lands when there is no order page to show: back on the tool page, with a line explaining why. */
const TOOL_NOTICE: Record<Exclude<FreeClaimOutcome, "claimed" | "already">, string> = {
  used: "used",
  canceled: "expired",
  sold_out: "soldout",
  invalid: "invalid",
};

/**
 * The link in the free-photo email. A click confirms the address and starts the staging; the customer lands on the
 * order page, which shows the progress and then both versions. Clicking again later just opens the order page.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const orderId = u.searchParams.get("o") ?? "";
  const token = u.searchParams.get("t") ?? "";
  try {
    const { outcome, order } = await claimFreePhoto(orderId, token);
    if ((outcome === "claimed" || outcome === "already") && order) {
      return NextResponse.redirect(appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}${outcome === "claimed" ? "&free=1" : ""}`));
    }
    return NextResponse.redirect(appUrl(`/tools/virtual-staging?free=${TOOL_NOTICE[outcome as keyof typeof TOOL_NOTICE] ?? "invalid"}#order`));
  } catch (err) {
    await reportError(err, { route: "free.claim", orderId });
    return NextResponse.redirect(appUrl(`/tools/virtual-staging?free=error#order`));
  }
}
