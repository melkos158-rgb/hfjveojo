import { prisma } from "@/lib/db";
import type { ToolDefinition, ToolConfigSnapshot } from "@/lib/tools/types";
import { listingClipsTool } from "@/lib/tools/definitions/listing-clips";
import { photoPricingGuideTool } from "@/lib/tools/definitions/photo-pricing-guide";

/**
 * The registry is the single list of tools the platform knows about.
 * To add a tool: create src/lib/tools/definitions/<slug>.ts and add it here. Run `npm run db:seed` to sync.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const definitions: ToolDefinition<any>[] = [listingClipsTool, photoPricingGuideTool];

export function allTools(): ToolDefinition[] {
  return definitions as ToolDefinition[];
}

export function getToolById(id: string): ToolDefinition | undefined {
  return (definitions as ToolDefinition[]).find((t) => t.id === id);
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return (definitions as ToolDefinition[]).find((t) => t.slug === slug);
}

export function snapshot(def: ToolDefinition): ToolConfigSnapshot {
  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    category: def.category,
    tagline: def.tagline,
    fulfillment: def.fulfillment,
    version: def.version,
    pricing: def.pricing,
    sla: def.sla,
    intakeFields: def.intake.fields,
  };
}

/**
 * Upsert Tool + ToolVersion + Product rows from code definitions. Status is NOT overwritten for existing
 * tools (admins control LIVE/PAUSED from /admin/tools); prices ARE synced from code unless the product was
 * edited by an admin (priceLocked flag lives in Product.description prefix "[locked]" — kept deliberately simple).
 */
export async function syncToolsToDatabase(): Promise<{ tools: number; products: number }> {
  let tools = 0;
  let products = 0;
  for (const def of allTools()) {
    const snap = snapshot(def);
    const existing = await prisma.tool.findUnique({ where: { id: def.id } });
    await prisma.tool.upsert({
      where: { id: def.id },
      create: {
        id: def.id,
        slug: def.slug,
        name: def.name,
        category: def.category,
        tagline: def.tagline,
        status: def.initialStatus,
        fulfillment: def.fulfillment,
        version: def.version,
        config: snap as object,
      },
      update: {
        slug: def.slug,
        name: def.name,
        category: def.category,
        tagline: def.tagline,
        fulfillment: def.fulfillment,
        version: def.version,
        config: snap as object,
        ...(existing ? {} : { status: def.initialStatus }),
      },
    });
    await prisma.toolVersion.upsert({
      where: { toolId_version: { toolId: def.id, version: def.version } },
      create: { toolId: def.id, version: def.version, config: snap as object },
      update: { config: snap as object },
    });
    tools++;

    const product = await prisma.product.findUnique({ where: { sku: def.pricing.sku } });
    const locked = product?.description?.startsWith("[locked]") ?? false;
    await prisma.product.upsert({
      where: { sku: def.pricing.sku },
      create: {
        sku: def.pricing.sku,
        toolId: def.id,
        name: def.pricing.name,
        description: def.tagline,
        type: "ONE_TIME",
        priceCents: def.pricing.priceCents,
        currency: def.pricing.currency,
        active: true,
      },
      update: locked
        ? { toolId: def.id, name: def.pricing.name }
        : { toolId: def.id, name: def.pricing.name, priceCents: def.pricing.priceCents, currency: def.pricing.currency },
    });
    products++;
  }
  return { tools, products };
}
