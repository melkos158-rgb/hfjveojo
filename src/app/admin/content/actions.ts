"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth/guards";
import { complete } from "@/lib/ai";
import { getToolById } from "@/lib/tools/registry";

const VERTICAL_TOOL: Record<string, string> = { "real-estate": "listing-clips", photography: "photo-pricing-guide" };

export async function generateContentAction(formData: FormData) {
  const admin = await requireAdminApi();
  const vertical = z.enum(["real-estate", "photography"]).parse(formData.get("vertical"));
  const angle = String(formData.get("angle") ?? "").slice(0, 200);
  const def = getToolById(VERTICAL_TOOL[vertical]);
  if (!def) throw new Error("Tool not found");

  const res = await complete(
    {
      tier: "cheap",
      system: `You write short social posts for a founder launching a small AI-assisted service. Voice: a competent person who knows the trade, relaxed, direct, no hype, no corporate words (elevate, seamless, unlock, game-changer), no fake numbers, no testimonials. Frame: BEFORE (the customer's pain, concrete) → the service (what they get, price, delivery) → AFTER (what changes). Each post ≤ 90 words. Give 3 variants for different platforms: Instagram caption, LinkedIn post, Facebook group comment. Use only the facts provided. Plain punctuation, at most one emoji per post.`,
      user: `Service: ${def.name} — ${def.tagline}\nWhat's included: ${def.landing.bullets.join("; ")}\nPrice: $${(def.pricing.priceCents / 100).toFixed(0)} one-time. Delivery: ${def.landing.deliveryPromise}\nHonest status: brand-new, looking for the first customers.${angle ? `\nAngle: ${angle}` : ""}`,
      maxOutputTokens: 700,
    },
    { purpose: "content", userId: admin.id },
  );

  await prisma.setting.upsert({
    where: { key: "content.latest" },
    create: { key: "content.latest", value: { vertical, createdAt: new Date().toISOString(), text: res.text } },
    update: { value: { vertical, createdAt: new Date().toISOString(), text: res.text } },
  });
  revalidatePath("/admin/content");
}
