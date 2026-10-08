/**
 * Prospect previews, client-safe part (src/lib/orders/prospect.ts creates them). Court ruling of 2026-10-06, session 2,
 * operator lever 2: after an agent replies to the owner's message and agrees, one room of the agent's own listing is
 * staged from a photo they sent or approved and shown on a private, unlisted page (the order page, opened by its
 * access token). Such an order is a $0 order (`free: true`) whose freeKey starts with this prefix; it is not a free
 * first photo (the agent can still claim one), and its page carries the "Finish this listing" offer.
 */
import type { Prisma } from "@prisma/client";

export const PROSPECT_KEY_PREFIX = "prospect:";

/**
 * Prisma filter for "not a prospect preview". A bare `NOT: { freeKey: { startsWith } }` would also drop the orders whose
 * freeKey is null (SQL: NOT (NULL LIKE …) is not true), which is nearly all of them, so null is allowed explicitly.
 */
export const NOT_PROSPECT_PREVIEW = { OR: [{ freeKey: null }, { NOT: { freeKey: { startsWith: PROSPECT_KEY_PREFIX } } }] } satisfies Prisma.OrderWhereInput;

export function isProspectPreview(order: { free: boolean; freeKey: string | null }): boolean {
  return order.free && (order.freeKey ?? "").startsWith(PROSPECT_KEY_PREFIX);
}

/** Who a preview was made for, as the admin typed it (an Instagram handle or a name); kept in the order's attribution. */
export function prospectOf(order: { attribution: unknown }): string | null {
  const p = (order.attribution as { prospect?: unknown } | null)?.prospect;
  return typeof p === "string" && p.trim() ? p.trim() : null;
}
