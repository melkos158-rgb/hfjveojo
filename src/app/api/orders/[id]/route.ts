import { loadOrderForViewer, publicOrderStatus } from "@/lib/orders/access";

export const dynamic = "force-dynamic";

/** Order status for the polling client. Exposes no intake or admin data. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t");
  const order = await loadOrderForViewer(id, t);
  if (!order) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ id: order.id, number: order.number, status: order.status, label: publicOrderStatus(order.status).label, deliveredAt: order.deliveredAt, dueAt: order.dueAt });
}
