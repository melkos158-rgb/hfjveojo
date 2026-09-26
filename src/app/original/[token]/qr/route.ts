import { originalPhotoFor } from "@/lib/orders/original-photo";
import { originalPhotoUrl, qrPng } from "@/lib/tools/disclosure";

export const dynamic = "force-dynamic";

/** QR code (PNG) that opens the public original-photo page — for flyers and other print, where a link can't be clicked. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!(await originalPhotoFor(token))) return new Response("Not found", { status: 404 });
  const png = await qrPng(originalPhotoUrl(token));
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="original-photo-qr.png"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
