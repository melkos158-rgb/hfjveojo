import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/security/http";
import { createProspectPreview, PROSPECT_MAX_LENGTH } from "@/lib/orders/prospect";
import { orderUrl } from "@/lib/orders/service";

const bodySchema = z.object({
  intake: z.record(z.string(), z.unknown()),
  prospect: z.string().trim().min(1, "Write who the preview is for (their Instagram handle or name).").max(PROSPECT_MAX_LENGTH),
});

/** Admin: stage one room from a photo a prospect sent or approved, for a private preview link (court lever 2). */
export async function POST(req: Request) {
  try {
    const admin = await requireAdminApi();
    const body = bodySchema.parse(await readJsonBody(req));
    const { orderId, accessToken } = await createProspectPreview({ intakeRaw: body.intake, prospect: body.prospect, adminId: admin.id, adminEmail: admin.email });
    // The private page the prospect will get: the admin's browser opens it, and its address is the link to send.
    return Response.json({ orderId, url: orderUrl({ id: orderId, accessToken }) });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: err.issues[0]?.message ?? "Please check the form fields" }, { status: 400 });
    return errorResponse(err);
  }
}
