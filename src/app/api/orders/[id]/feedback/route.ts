import { z } from "zod";
import { prisma } from "@/lib/db";
import { loadOrderForViewer } from "@/lib/orders/access";
import { errorResponse } from "@/lib/errors";
import { track } from "@/lib/analytics/events";
import { notifyAdmins } from "@/lib/orders/service";

const schema = z.object({ rating: z.number().int().min(1).max(5).nullable().optional(), text: z.string().trim().min(3).max(4000) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const t = new URL(req.url).searchParams.get("t");
    const order = await loadOrderForViewer(id, t);
    if (!order) return Response.json({ error: "not_found" }, { status: 404 });
    const body = schema.parse(await req.json());
    await prisma.feedback.create({
      data: { orderId: order.id, userId: order.userId, email: order.customerEmail, rating: body.rating ?? null, text: body.text, source: "order_page" },
    });
    await track("feedback_submitted", { orderId: order.id, props: { rating: body.rating ?? null } });
    await notifyAdmins(`Feedback on order #${order.number} (${body.rating ?? "-"}/5)`, body.text);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: "Please write at least a few words" }, { status: 400 });
    return errorResponse(err);
  }
}
