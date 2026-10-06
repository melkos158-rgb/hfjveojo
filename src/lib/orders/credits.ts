import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/magic";
import { CREDIT_KEY_PREFIX, CREDIT_MONTHS, CREDIT_TOOL_SLUG, CREDIT_USE_TOOL_SLUG, CREDITS_PER_PACK } from "@/lib/orders/credit-rules";

export { CREDIT_KEY_PREFIX, CREDIT_TOOL_SLUG, CREDIT_USE_TOOL_SLUG, CREDITS_PER_PACK, CREDIT_MONTHS };

export const CREDIT_VALID_MS = CREDIT_MONTHS * 30.44 * 24 * 3600 * 1000;

export type CreditBalance = { rooms: number; validUntil: Date | null };

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Pro credit balance of an email, computed from orders (no ledger table). Every paid, unrefunded Pro credit order is a
 * pack of 25 rooms valid CREDIT_MONTHS from payment; every staging order paid with credits (freeKey "credit:…", not
 * cancelled or refunded) takes its rooms from the oldest pack still valid when it was placed. A refunded credit order
 * gives its rooms back; a refunded purchase takes its pack away. `validUntil` is the earliest expiry among the packs
 * that still have rooms (the date the next rooms run out).
 */
export async function creditBalance(emailRaw: string, now = new Date(), db: Db = prisma): Promise<CreditBalance> {
  const email = normalizeEmail(emailRaw);
  const purchases = await db.order.findMany({
    where: { customerEmail: email, toolId: CREDIT_TOOL_SLUG, free: false, paidAt: { not: null }, status: { notIn: ["REFUNDED", "CANCELED"] } },
    select: { paidAt: true, quantity: true },
    orderBy: { paidAt: "asc" },
  });
  if (purchases.length === 0) return { rooms: 0, validUntil: null };
  const packs = purchases.map((p) => {
    const from = (p.paidAt as Date).getTime();
    return { left: CREDITS_PER_PACK * Math.max(1, p.quantity), from, until: from + CREDIT_VALID_MS };
  });
  const spent = await db.order.findMany({
    where: { customerEmail: email, free: true, freeKey: { startsWith: CREDIT_KEY_PREFIX }, status: { notIn: ["CANCELED", "REFUNDED"] }, createdAt: { gte: purchases[0].paidAt as Date } },
    select: { createdAt: true, quantity: true },
    orderBy: { createdAt: "asc" },
  });
  for (const s of spent) {
    const at = s.createdAt.getTime();
    let need = s.quantity;
    for (const p of packs) {
      if (need === 0) break;
      if (p.left === 0 || p.from > at || p.until <= at) continue;
      const take = Math.min(p.left, need);
      p.left -= take;
      need -= take;
    }
  }
  const live = packs.filter((p) => p.left > 0 && p.until > now.getTime());
  if (live.length === 0) return { rooms: 0, validUntil: null };
  return { rooms: live.reduce((n, p) => n + p.left, 0), validUntil: new Date(Math.min(...live.map((p) => p.until))) };
}
