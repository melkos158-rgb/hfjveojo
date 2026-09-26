import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/security/http";
import { createExternalOrder, EXTERNAL_CHANNELS } from "@/lib/orders/external";

const bodySchema = z.object({
  toolSlug: z.string().min(1).max(80),
  intake: z.record(z.string(), z.unknown()),
  channel: z.enum(EXTERNAL_CHANNELS),
  amountCents: z.number().int(),
  feeCents: z.number().int(),
  externalRef: z.string().trim().max(80).optional(),
  deliverTo: z.email(),
});

/** Admin: record an order paid on a marketplace or in a direct deal and run it through the pipeline. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdminApi();
    const body = bodySchema.parse(await readJsonBody(req));
    const result = await createExternalOrder({ ...body, intakeRaw: body.intake, externalRef: body.externalRef || undefined, adminId: admin.id });
    return Response.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: "invalid", message: err.issues[0]?.message ?? "Please check the form fields" }, { status: 400 });
    return errorResponse(err);
  }
}
