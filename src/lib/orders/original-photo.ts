import { prisma } from "@/lib/db";
import { getToolBySlug } from "@/lib/tools/registry";
import { PAID_STATUSES } from "@/lib/orders/access";
import { photoInputsOf } from "@/lib/tools/photos";
import type { ToolDefinition } from "@/lib/tools/types";

/**
 * The paid order behind a public disclosure token and its original uploads (one per room), with `fileId` null once a
 * file has been purged after the retention period.
 */
export async function originalPhotoFor(token: string): Promise<{ photos: Array<{ fileId: string | null; label: string }> } | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  const order = await prisma.order.findUnique({ where: { publicToken: token }, select: { status: true, intake: true, tool: { select: { slug: true } } } });
  if (!order || !PAID_STATUSES.includes(order.status)) return null;
  const inputs = photoInputsOf(getToolBySlug(order.tool.slug) as ToolDefinition<unknown> | undefined, order.intake);
  const stored = new Set((await prisma.file.findMany({ where: { id: { in: inputs.map((p) => p.fileId) } }, select: { id: true } })).map((f) => f.id));
  return { photos: inputs.map((p) => ({ fileId: stored.has(p.fileId) ? p.fileId : null, label: p.label })) };
}
