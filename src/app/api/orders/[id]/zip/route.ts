import { loadOrderForViewer } from "@/lib/orders/access";
import { deliveredOutputs } from "@/lib/orders/deliverables";
import { getFileBuffer } from "@/lib/storage";
import { zipFiles } from "@/lib/zip";
import { rateLimit, ipHash } from "@/lib/security/ratelimit";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** Every file of the order's latest delivery in one ZIP. Same access rule as the order page (owner, admin or order token). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await rateLimit({ key: `zip:${ipHash(req)}`, limit: 20, windowSeconds: 600 });
    const { id } = await ctx.params;
    const token = new URL(req.url).searchParams.get("t");
    const order = await loadOrderForViewer(id, token);
    if (!order) return new Response("Not found", { status: 404 });
    const shown = deliveredOutputs(order.outputs).filter((o) => o.fileId);
    if (shown.length === 0) return new Response("No files delivered yet", { status: 409 });
    const files: Array<{ name: string; data: Buffer }> = [];
    for (const o of shown) {
      const f = await getFileBuffer(o.fileId as string);
      if (f) files.push({ name: f.file.name, data: f.data });
    }
    const zip = zipFiles(files);
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="orvionis-order-${order.number}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
