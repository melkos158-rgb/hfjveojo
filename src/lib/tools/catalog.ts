import { prisma } from "@/lib/db";
import { allTools } from "@/lib/tools/registry";
import type { ToolDefinition } from "@/lib/tools/types";

export type CatalogItem = {
  def: ToolDefinition;
  status: string;
  priceCents: number;
  currency: string;
};

/** Tools that are orderable (LIVE or VALIDATING) with their current DB price. Falls back to code defaults if the DB is empty. */
export async function liveCatalog(category?: string): Promise<CatalogItem[]> {
  const defs = allTools().filter((d) => d.active !== false && (!category || d.category === category));
  let rows: Array<{ id: string; status: string; products: Array<{ priceCents: number; currency: string; active: boolean; type: string }> }> = [];
  try {
    rows = await prisma.tool.findMany({ where: { id: { in: defs.map((d) => d.id) } }, include: { products: true } });
  } catch {
    rows = [];
  }
  const items: CatalogItem[] = [];
  for (const def of defs) {
    const row = rows.find((r) => r.id === def.id);
    const status = row?.status ?? def.initialStatus;
    if (!["LIVE", "VALIDATING"].includes(status)) continue;
    const product = row?.products.find((p) => p.active && p.type === "ONE_TIME");
    items.push({ def, status, priceCents: product?.priceCents ?? def.pricing.priceCents, currency: product?.currency ?? def.pricing.currency });
  }
  // featured first, then by price ascending so the cheapest "try it" tool is never buried
  return items.sort((a, b) => Number(Boolean(b.def.featured)) - Number(Boolean(a.def.featured)) || a.priceCents - b.priceCents);
}
