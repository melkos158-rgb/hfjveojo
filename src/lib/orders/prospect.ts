import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken } from "@/lib/security/tokens";
import { photoInputsOf, quantityOf } from "@/lib/tools/photos";
import type { ToolDefinition } from "@/lib/tools/types";
import { track } from "@/lib/analytics/events";
import { FINISH_TOOL_SLUG } from "@/lib/orders/finish";
import { PROSPECT_KEY_PREFIX, isProspectPreview, prospectOf } from "@/lib/orders/prospect-rules";

export { PROSPECT_KEY_PREFIX, isProspectPreview, prospectOf };

export const PROSPECT_MAX_LENGTH = 80;

export type ProspectPreviewInput = {
  intakeRaw: unknown;
  /** Who it is for, as the admin types it: an Instagram handle or a name. Shown in admin only. */
  prospect: string;
  adminId: string;
  /** The admin who made it: the "preview is ready" email with the link to send goes there. */
  adminEmail: string;
};

/**
 * Court ruling of 2026-10-06 (session 2, operator lever 2): a personal preview of the prospect's own room, made only
 * after they replied and agreed, from a photo they sent or approved. One room, staged by the normal pipeline (two
 * versions, labeled copies, the disclosure page), on a private, unlisted page: the order page opened by its access
 * token. The order is $0 and PAID at once (an admin made it, so there is no email to confirm); its key keeps it out of
 * the free-photo counts and the one-free-photo rule, and its page offers "Finish this listing" for 7 days.
 */
export async function createProspectPreview(input: ProspectPreviewInput): Promise<{ orderId: string; accessToken: string }> {
  const def = getToolBySlug(FINISH_TOOL_SLUG);
  if (!def) throw new AppError("Unknown tool", 404, "unknown_tool");
  const product = await prisma.product.findFirst({ where: { toolId: def.id, active: true, type: "ONE_TIME" } });
  if (!product) throw new AppError("No active price for this tool", 409, "no_product");

  const prospect = input.prospect.trim().replace(/\s+/g, " ");
  if (!prospect) throw new AppError("Write who the preview is for (their Instagram handle or name).", 400, "prospect_missing");
  if (prospect.length > PROSPECT_MAX_LENGTH) throw new AppError(`Keep the name or handle under ${PROSPECT_MAX_LENGTH} characters.`, 400, "prospect_too_long");

  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;
  const tool = def as ToolDefinition<unknown>;
  if (quantityOf(tool, intake) !== 1) throw new AppError("A preview is one room. Keep one photo in the form.", 400, "preview_one_photo");

  const fileIds = [...new Set(photoInputsOf(tool, intake).map((p) => p.fileId))];
  const files = await prisma.file.findMany({ where: { id: { in: fileIds } }, select: { id: true, kind: true, expiresAt: true, order: { select: { status: true } } } });
  for (const id of fileIds) {
    const f = files.find((x) => x.id === id);
    const ok = f && f.kind === "INPUT" && (!f.expiresAt || f.expiresAt > new Date()) && (!f.order || ["PENDING", "CANCELED"].includes(f.order.status));
    if (!ok) throw new AppError("The uploaded photo could not be found — upload it again.", 400, "upload_missing");
  }

  const now = new Date();
  const order = await prisma.order.create({
    data: {
      status: "PAID",
      paidAt: now,
      free: true,
      freeKey: `${PROSPECT_KEY_PREFIX}${randomToken(9)}`,
      isTest: false,
      livemode: false,
      publicToken: def.disclosurePack ? randomToken(12) : undefined,
      customerEmail: input.adminEmail,
      toolId: def.id,
      toolVersion: def.version,
      productId: product.id,
      intake: intake as object,
      amountCents: 0,
      quantity: 1,
      currency: product.currency,
      accessToken: randomToken(24),
      attribution: { utm_source: "prospect_preview", utm_medium: "dm", prospect },
      adminNotes: `Prospect preview for ${prospect}: once it is delivered, send them the customer order page link.`,
      dueAt: new Date(now.getTime() + def.sla.deliveryHours * 3600 * 1000),
    },
  });
  await prisma.file.updateMany({ where: { id: { in: fileIds } }, data: { orderId: order.id, expiresAt: new Date(now.getTime() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) } });
  await prisma.adminAction.create({ data: { adminId: input.adminId, action: "prospect_preview", targetType: "order", targetId: order.id, details: { prospect } } });
  await track("prospect_preview_created", { orderId: order.id, props: { tool: def.id } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId: order.id }, { orderId: order.id });
  return { orderId: order.id, accessToken: order.accessToken };
}

export type ProspectPreviewRow = {
  id: string;
  number: number;
  prospect: string | null;
  status: string;
  createdAt: Date;
  deliveredAt: Date | null;
  accessToken: string;
  /** Paid orders that used this preview's "Finish this listing" link. */
  finishedPaid: number;
};

/** The newest prospect previews with how many paid orders finished their listing (for /admin/orders/preview). */
export async function recentProspectPreviews(limit = 30): Promise<ProspectPreviewRow[]> {
  const previews = await prisma.order.findMany({
    where: { free: true, freeKey: { startsWith: PROSPECT_KEY_PREFIX } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, number: true, status: true, createdAt: true, deliveredAt: true, accessToken: true, attribution: true },
  });
  const finished = await finishOrdersOf(previews.map((p) => p.id));
  return previews.map((p) => ({ id: p.id, number: p.number, prospect: prospectOf(p), status: p.status, createdAt: p.createdAt, deliveredAt: p.deliveredAt, accessToken: p.accessToken, finishedPaid: finished.get(p.id) ?? 0 }));
}

/** Paid, unrefunded orders per source order whose intake says `finishOf: <source order id>`. */
export async function finishOrdersOf(sourceIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (sourceIds.length === 0) return out;
  const wanted = new Set(sourceIds);
  const paid = await prisma.order.findMany({
    where: { toolId: FINISH_TOOL_SLUG, free: false, isTest: false, paidAt: { not: null }, status: { notIn: ["REFUNDED", "CANCELED"] } },
    select: { intake: true },
  });
  for (const o of paid) {
    const src = (o.intake as { finishOf?: unknown } | null)?.finishOf;
    if (typeof src === "string" && wanted.has(src)) out.set(src, (out.get(src) ?? 0) + 1);
  }
  return out;
}
