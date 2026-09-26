"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth/guards";
import { deliverOrder, refundOrder, retryOrder } from "@/lib/orders/service";
import { generateCeoReport } from "@/lib/ceo/report";
import { enqueue } from "@/lib/jobs/queue";

/**
 * Admin mutations as server actions. Every action re-checks the admin session server-side.
 * High-impact actions (refund, price change, tool pause) are logged in AdminAction.
 */

async function audit(adminId: string, action: string, targetType: string, targetId: string, details?: Record<string, unknown>) {
  await prisma.adminAction.create({ data: { adminId, action, targetType, targetId, details: details as object } });
}

export async function deliverOrderAction(formData: FormData) {
  const admin = await requireAdminApi();
  const orderId = z.string().parse(formData.get("orderId"));
  const deliveryLink = String(formData.get("deliveryLink") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  await deliverOrder(orderId, { by: "admin", adminId: admin.id, deliveryLink: deliveryLink || undefined, note: note || undefined });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function retryOrderAction(formData: FormData) {
  const admin = await requireAdminApi();
  const orderId = z.string().parse(formData.get("orderId"));
  await retryOrder(orderId, admin.id);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function refundOrderAction(formData: FormData) {
  const admin = await requireAdminApi();
  const orderId = z.string().parse(formData.get("orderId"));
  const amountRaw = String(formData.get("amountCents") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  await refundOrder(orderId, { adminId: admin.id, amountCents: amountRaw ? Number(amountRaw) : undefined, reason: reason || undefined });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function saveOrderNotesAction(formData: FormData) {
  const admin = await requireAdminApi();
  const orderId = z.string().parse(formData.get("orderId"));
  const adminNotes = String(formData.get("adminNotes") ?? "").slice(0, 4000);
  await prisma.order.update({ where: { id: orderId }, data: { adminNotes } });
  await audit(admin.id, "order_notes", "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markQcApprovedAction(formData: FormData) {
  const admin = await requireAdminApi();
  const orderId = z.string().parse(formData.get("orderId"));
  await prisma.order.update({ where: { id: orderId }, data: { qcStatus: "APPROVED_BY_HUMAN" } });
  await audit(admin.id, "qc_approve", "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function setToolStatusAction(formData: FormData) {
  const admin = await requireAdminApi();
  const toolId = z.string().parse(formData.get("toolId"));
  const status = z.enum(["DRAFT", "VALIDATING", "LIVE", "PAUSED", "DEPRECATED"]).parse(formData.get("status"));
  await prisma.tool.update({ where: { id: toolId }, data: { status } });
  await audit(admin.id, "tool_status", "tool", toolId, { status });
  revalidatePath("/admin/tools");
}

export async function setProductPriceAction(formData: FormData) {
  const admin = await requireAdminApi();
  const productId = z.string().parse(formData.get("productId"));
  const priceCents = z.coerce.number().int().min(100).max(1_000_000).parse(formData.get("priceCents"));
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const description = product.description?.startsWith("[locked]") ? product.description : `[locked] ${product.description ?? ""}`.trim();
  await prisma.product.update({ where: { id: productId }, data: { priceCents, description } });
  await audit(admin.id, "price_change", "product", productId, { from: product.priceCents, to: priceCents });
  revalidatePath("/admin/tools");
  revalidatePath("/pricing");
}

const experimentSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(2).max(120),
  hypothesis: z.string().min(5).max(2000),
  targetCustomer: z.string().min(2).max(300),
  offer: z.string().min(2).max(500),
  channel: z.string().min(2).max(120),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  successCriteria: z.string().min(2).max(1000),
  failureCriteria: z.string().min(2).max(1000),
  expectedOrders: z.coerce.number().int().nonnegative().optional(),
  expectedRevenueCents: z.coerce.number().int().nonnegative().optional(),
  expectedCostCents: z.coerce.number().int().nonnegative().optional(),
});

export async function createExperimentAction(formData: FormData) {
  const admin = await requireAdminApi();
  const data = experimentSchema.parse(Object.fromEntries(formData.entries()));
  const exp = await prisma.experiment.create({
    data: {
      key: data.key,
      name: data.name,
      hypothesis: data.hypothesis,
      targetCustomer: data.targetCustomer,
      offer: data.offer,
      channel: data.channel,
      priceCents: data.priceCents,
      successCriteria: data.successCriteria,
      failureCriteria: data.failureCriteria,
      expected: { orders: data.expectedOrders ?? null, revenueCents: data.expectedRevenueCents ?? null, costCents: data.expectedCostCents ?? null },
      status: "RUNNING",
      startAt: new Date(),
    },
  });
  await audit(admin.id, "experiment_create", "experiment", exp.id);
  revalidatePath("/admin/experiments");
}

export async function updateExperimentAction(formData: FormData) {
  const admin = await requireAdminApi();
  const id = z.string().parse(formData.get("id"));
  const status = z.enum(["PLANNED", "RUNNING", "WON", "LOST", "PAUSED"]).parse(formData.get("status"));
  const conclusion = String(formData.get("conclusion") ?? "").slice(0, 4000);
  const nextAction = String(formData.get("nextAction") ?? "").slice(0, 2000);
  await prisma.experiment.update({
    where: { id },
    data: { status, conclusion: conclusion || null, nextAction: nextAction || null, endAt: ["WON", "LOST"].includes(status) ? new Date() : undefined },
  });
  await audit(admin.id, "experiment_update", "experiment", id, { status });
  revalidatePath("/admin/experiments");
}

export async function logChannelCostAction(formData: FormData) {
  const admin = await requireAdminApi();
  const key = z.string().regex(/^[a-z0-9_-]{2,40}$/).parse(formData.get("channel"));
  const name = String(formData.get("channelName") ?? key);
  const costCents = z.coerce.number().int().nonnegative().parse(formData.get("costCents") ?? 0);
  const hours = z.coerce.number().nonnegative().optional().parse(formData.get("hours") || undefined);
  const note = String(formData.get("note") ?? "").slice(0, 500);
  const experimentKey = String(formData.get("experimentKey") ?? "").trim();
  const channel = await prisma.marketingChannel.upsert({ where: { key }, create: { key, name }, update: {} });
  const experiment = experimentKey ? await prisma.experiment.findUnique({ where: { key: experimentKey } }) : null;
  await prisma.channelCost.create({ data: { channelId: channel.id, experimentId: experiment?.id, date: new Date(), costCents, hours, note: note || null } });
  await audit(admin.id, "channel_cost", "channel", channel.id, { costCents, hours });
  revalidatePath("/admin/experiments");
  revalidatePath("/admin/analytics");
}

export async function markFeedbackHandledAction(formData: FormData) {
  await requireAdminApi();
  const id = z.string().parse(formData.get("id"));
  await prisma.feedback.update({ where: { id }, data: { handled: true } });
  revalidatePath("/admin/feedback");
}

export async function toggleKillSwitchAction(formData: FormData) {
  const admin = await requireAdminApi();
  const on = formData.get("on") === "1";
  await prisma.setting.upsert({ where: { key: "ai.kill_switch" }, create: { key: "ai.kill_switch", value: on }, update: { value: on } });
  await audit(admin.id, "ai_kill_switch", "setting", "ai.kill_switch", { on });
  revalidatePath("/admin/system");
}

export async function runReportNowAction() {
  await requireAdminApi();
  await generateCeoReport("DAILY");
  revalidatePath("/admin/analytics");
}

export async function enqueueMaintenanceAction() {
  await requireAdminApi();
  await enqueue("maintenance", {});
  revalidatePath("/admin/system");
}

export async function requeueJobAction(formData: FormData) {
  await requireAdminApi();
  const id = z.string().parse(formData.get("id"));
  await prisma.job.update({ where: { id }, data: { status: "QUEUED", runAt: new Date(), attempts: 0, lastError: null } });
  revalidatePath("/admin/system");
}

export async function applyStripeBrandingAction() {
  const admin = await requireAdminApi();
  const { applyStripeBranding } = await import("@/lib/stripe/branding");
  const result = await applyStripeBranding();
  const value = { ok: result.ok, message: result.message, at: new Date().toISOString() };
  await prisma.setting.upsert({ where: { key: "stripe.branding_last" }, create: { key: "stripe.branding_last", value }, update: { value } });
  await audit(admin.id, "stripe_branding_apply", "stripe", "account", value);
  revalidatePath("/admin/system");
}
