import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken, signPayload, verifyPayload } from "@/lib/security/tokens";
import { normalizeEmail, upsertUserByEmail } from "@/lib/auth/magic";
import { track } from "@/lib/analytics/events";
import { CREDIT_KEY_PREFIX } from "@/lib/orders/credit-rules";
import { isProspectPreview, PROSPECT_KEY_PREFIX } from "@/lib/orders/prospect-rules";

/**
 * The MLS description that comes with a virtual staging order: included in the Listing Pack (4+ rooms) and sold as a
 * $7 add-on on 1-3 rooms (src/config/staging-pricing.ts, court ruling of 2026-10-06). The staging order is marked
 * `intake.extraIncluded`; its delivery email and order page carry a signed voucher link to the Listing Description
 * tool, where the customer enters the listing facts. Redeeming it creates the description order as already paid, for
 * $0 (it was paid inside the staging order): `free: true`, so it never counts as revenue twice, and
 * `freeKey = "desc:<staging order id>"`, unique, so each voucher works once.
 */
export const DESCRIPTION_TOOL_SLUG = "listing-description";
export const VOUCHER_KEY_PREFIX = "desc:";
export const VOUCHER_TTL_SECONDS = 180 * 24 * 3600;
/** A paid staging order may hand out its description from payment on (the customer can write it while the photos run). */
const REDEEMABLE_STATUSES = ["PAID", "PROCESSING", "REVIEW", "RETRYING", "COMPLETED", "FAILED"];

export type VoucherProblem = "invalid" | "used" | "unpaid";

const PROBLEM_TEXT: Record<VoucherProblem, string> = {
  invalid: "This description link didn't work. Open it again from your staging order's email or order page.",
  used: "The description included with that staging order has already been written: it's on its own order page and in your email.",
  unpaid: "The staging order behind this link isn't paid, so its description isn't included.",
};

/** Whether an order (any tool) carries an included description voucher. */
export function orderHasVoucher(order: { intake: unknown }): boolean {
  const intake = order.intake as Record<string, unknown> | null;
  return Boolean(intake && intake.extraIncluded === true);
}

/** A free description order made from a voucher (not a free first photo). */
export function isVoucherOrder(order: { free: boolean; freeKey: string | null }): boolean {
  return order.free && (order.freeKey ?? "").startsWith(VOUCHER_KEY_PREFIX);
}

/** A staging order paid with Pro credits (src/lib/orders/credits.ts): $0 here, the money came with the credits. */
export function isCreditOrder(order: { free: boolean; freeKey: string | null }): boolean {
  return order.free && (order.freeKey ?? "").startsWith(CREDIT_KEY_PREFIX);
}

/** A claimed or pending free first photo (the free orders that are not voucher, credit or prospect preview orders). */
export function isFreePhotoOrder(order: { free: boolean; freeKey: string | null }): boolean {
  return order.free && !isVoucherOrder(order) && !isCreditOrder(order) && !isProspectPreview(order);
}

/** The $0 orders that are not free first photos, for queries: `NOT: NOT_FREE_PHOTO_KEYS` keeps only free photos. */
export const NOT_FREE_PHOTO_KEYS = [{ freeKey: { startsWith: VOUCHER_KEY_PREFIX } }, { freeKey: { startsWith: CREDIT_KEY_PREFIX } }, { freeKey: { startsWith: PROSPECT_KEY_PREFIX } }];

export function voucherToken(orderId: string): string {
  return signPayload({ o: orderId, k: "desc" }, VOUCHER_TTL_SECONDS);
}

/** The link in the delivery email and on the order page. */
export function descriptionVoucherUrl(orderId: string): string {
  return appUrl(`/tools/${DESCRIPTION_TOOL_SLUG}?voucher=${encodeURIComponent(voucherToken(orderId))}#order`);
}

/** Checks a voucher without using it: the tool page shows the "included" form only for a good one. */
export async function checkVoucher(token: string | null | undefined): Promise<{ ok: true; sourceOrderId: string; email: string } | { ok: false; problem: VoucherProblem }> {
  if (!token) return { ok: false, problem: "invalid" };
  const payload = verifyPayload<{ o: string; k: string }>(token);
  if (!payload || payload.k !== "desc" || typeof payload.o !== "string") return { ok: false, problem: "invalid" };
  const source = await prisma.order.findUnique({ where: { id: payload.o }, select: { id: true, status: true, intake: true, customerEmail: true, free: true } });
  if (!source || !orderHasVoucher(source) || source.free) return { ok: false, problem: "invalid" };
  if (!REDEEMABLE_STATUSES.includes(source.status)) return { ok: false, problem: "unpaid" };
  const used = await prisma.order.findUnique({ where: { freeKey: `${VOUCHER_KEY_PREFIX}${source.id}` }, select: { id: true } });
  if (used) return { ok: false, problem: "used" };
  return { ok: true, sourceOrderId: source.id, email: source.customerEmail };
}

export type RedeemInput = { token: string; email: string; intakeRaw: unknown; userId?: string | null };

/** Voucher + the listing facts → a paid ($0) description order, queued at once. Returns the order page URL. */
export async function redeemDescriptionVoucher(input: RedeemInput): Promise<{ orderId: string; checkoutUrl: string }> {
  const check = await checkVoucher(input.token);
  if (!check.ok) throw new AppError(PROBLEM_TEXT[check.problem], check.problem === "used" ? 409 : 400, `voucher_${check.problem}`);

  const def = getToolBySlug(DESCRIPTION_TOOL_SLUG);
  if (!def) throw new AppError("Unknown tool", 404, "unknown_tool");
  const product = await prisma.product.findFirst({ where: { toolId: def.id, active: true, type: "ONE_TIME" } });
  if (!product) throw new AppError("No active price for this tool", 409, "no_product");
  const email = z.email().parse(normalizeEmail(input.email));
  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;
  const source = await prisma.order.findUniqueOrThrow({ where: { id: check.sourceOrderId }, select: { id: true, isTest: true, number: true } });
  const user = await upsertUserByEmail(email);
  const now = new Date();

  let order;
  try {
    order = await prisma.order.create({
      data: {
        isTest: source.isTest,
        userId: input.userId ?? user.id,
        customerEmail: email,
        customerName: typeof intake.agentName === "string" && intake.agentName ? intake.agentName : null,
        toolId: def.id,
        toolVersion: def.version,
        productId: product.id,
        status: "PAID",
        paidAt: now,
        free: true,
        freeKey: `${VOUCHER_KEY_PREFIX}${source.id}`,
        intake: { ...intake, includedWith: source.id } as object,
        amountCents: 0,
        quantity: 1,
        currency: product.currency,
        accessToken: randomToken(24),
        dueAt: new Date(now.getTime() + def.sla.deliveryHours * 3600 * 1000),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new AppError(PROBLEM_TEXT.used, 409, "voucher_used");
    throw err;
  }
  await track("description_voucher_redeemed", { orderId: order.id, userId: user.id, props: { tool: def.id, source: source.id } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId: order.id }, { orderId: order.id });
  return { orderId: order.id, checkoutUrl: appUrl(`/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`) };
}
