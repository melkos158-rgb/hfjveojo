import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getToolBySlug } from "@/lib/tools/registry";
import { randomToken } from "@/lib/security/tokens";
import { photoInputsOf, quantityOf } from "@/lib/tools/photos";
import type { ToolDefinition } from "@/lib/tools/types";
import { track } from "@/lib/analytics/events";

/** Where an order paid outside Stripe came from (a marketplace or a direct deal). */
export const EXTERNAL_CHANNELS = ["fiverr", "upwork", "etsy", "direct", "other"] as const;
export type ExternalChannel = (typeof EXTERNAL_CHANNELS)[number];

/** Marketplace fee the channel keeps from the buyer's price (Fiverr and Upwork take 20 % from new sellers). */
export const DEFAULT_FEE_RATE: Record<ExternalChannel, number> = { fiverr: 0.2, upwork: 0.1, etsy: 0.1, direct: 0, other: 0 };

export type ExternalOrderInput = {
  toolSlug: string;
  intakeRaw: unknown;
  channel: ExternalChannel;
  /** What the buyer paid on the channel, in cents of the tool's currency. */
  amountCents: number;
  /** What the channel keeps (fees); the rest is our revenue after fees. */
  feeCents: number;
  /** The channel's order reference, e.g. Fiverr "FO123…". */
  externalRef?: string;
  /** Who receives the delivery email with the files (the admin forwarding them on the marketplace). */
  deliverTo: string;
  adminId: string;
};

/**
 * An order paid outside Stripe — a Fiverr/Upwork/Etsy sale or a direct deal — run through the same pipeline as a
 * website order. It is created PAID (the money was taken by the channel), counts as real revenue with the channel's
 * fee as the payment fee, and shows up per channel in the analytics. The files go to `deliverTo` and stay on the order
 * page; the admin delivers them on the marketplace.
 */
export async function createExternalOrder(input: ExternalOrderInput): Promise<{ orderId: string }> {
  const def = getToolBySlug(input.toolSlug);
  if (!def) throw new AppError("Unknown tool", 404, "unknown_tool");
  const product = await prisma.product.findFirst({ where: { toolId: def.id, active: true, type: "ONE_TIME" } });
  if (!product) throw new AppError("No active price for this tool", 409, "no_product");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 100 || input.amountCents > 1_000_000) throw new AppError("Amount must be between $1 and $10,000", 400, "bad_amount");
  if (!Number.isInteger(input.feeCents) || input.feeCents < 0 || input.feeCents > input.amountCents) throw new AppError("Fee must be between $0 and the amount", 400, "bad_fee");

  const parsed = def.intake.schema.safeParse(input.intakeRaw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(`${first?.path.join(".") || "intake"}: ${first?.message ?? "invalid"}`, 400, "invalid_intake");
  }
  const intake = parsed.data as Record<string, unknown>;
  const tool = def as ToolDefinition<unknown>;
  const fileIds = [...new Set(photoInputsOf(tool, intake).map((p) => p.fileId))];
  if (fileIds.length > 0) {
    const files = await prisma.file.findMany({ where: { id: { in: fileIds } }, select: { id: true, kind: true, expiresAt: true, order: { select: { status: true } } } });
    for (const id of fileIds) {
      const f = files.find((x) => x.id === id);
      const ok = f && f.kind === "INPUT" && (!f.expiresAt || f.expiresAt > new Date()) && (!f.order || ["PENDING", "CANCELED"].includes(f.order.status));
      if (!ok) throw new AppError("An uploaded photo could not be found — upload it again.", 400, "upload_missing");
    }
  }

  const now = new Date();
  const order = await prisma.order.create({
    data: {
      status: "PAID",
      paidAt: now,
      isTest: false,
      livemode: false,
      publicToken: def.disclosurePack ? randomToken(12) : undefined,
      customerEmail: input.deliverTo,
      toolId: def.id,
      toolVersion: def.version,
      productId: product.id,
      intake: intake as object,
      amountCents: input.amountCents,
      quantity: quantityOf(tool, intake),
      currency: product.currency,
      accessToken: randomToken(24),
      attribution: { utm_source: input.channel, utm_medium: "marketplace", ref: input.externalRef ?? null, external: true },
      adminNotes: `External order (${input.channel}${input.externalRef ? ` ${input.externalRef}` : ""}) — deliver the files on the channel.`,
      dueAt: new Date(now.getTime() + def.sla.deliveryHours * 3600 * 1000),
      payments: {
        create: {
          amountCents: input.amountCents,
          currency: product.currency,
          status: "SUCCEEDED",
          feeCents: input.feeCents,
          netCents: input.amountCents - input.feeCents,
          raw: { provider: input.channel, ref: input.externalRef ?? null },
        },
      },
    },
  });
  if (fileIds.length > 0) {
    await prisma.file.updateMany({ where: { id: { in: fileIds } }, data: { orderId: order.id, expiresAt: new Date(now.getTime() + env().FILE_RETENTION_DAYS_OUTPUT * 24 * 3600 * 1000) } });
  }
  await prisma.adminAction.create({
    data: { adminId: input.adminId, action: "external_order", targetType: "order", targetId: order.id, details: { channel: input.channel, ref: input.externalRef ?? null, amountCents: input.amountCents, feeCents: input.feeCents } },
  });
  await track("order_paid", { orderId: order.id, props: { amountCents: input.amountCents, tool: def.id, channel: input.channel, external: 1 } });
  const { enqueue } = await import("@/lib/jobs/queue");
  await enqueue("fulfill_order", { orderId: order.id }, { orderId: order.id });
  return { orderId: order.id };
}
