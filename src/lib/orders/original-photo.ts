import { prisma } from "@/lib/db";
import { getToolBySlug } from "@/lib/tools/registry";
import { PAID_STATUSES } from "@/lib/orders/access";

/** The paid order behind a public disclosure token and the id of its original upload (null once the file is purged). */
export async function originalPhotoFor(token: string): Promise<{ fileId: string | null } | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  const order = await prisma.order.findUnique({ where: { publicToken: token }, select: { status: true, intake: true, tool: { select: { slug: true } } } });
  if (!order || !PAID_STATUSES.includes(order.status)) return null;
  const field = getToolBySlug(order.tool.slug)?.intake.fields.find((f) => f.type === "image");
  const id = field ? (order.intake as Record<string, unknown>)[field.key] : null;
  const file = typeof id === "string" ? await prisma.file.findUnique({ where: { id }, select: { id: true } }) : null;
  return { fileId: file?.id ?? null };
}
