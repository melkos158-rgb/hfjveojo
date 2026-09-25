import type { ToolDefinition } from "@/lib/tools/types";
import { listingClipsTool } from "@/lib/tools/definitions/listing-clips";
import { photoPricingGuideTool } from "@/lib/tools/definitions/photo-pricing-guide";

/**
 * The static list of tool definitions — pure data + pipeline code, no database access — so pages that
 * must not touch the DB at build time (Open Graph cards, sitemaps) can read it. The registry
 * (`@/lib/tools/registry`) adds the DB-backed helpers on top of this list.
 * To add a tool: create src/lib/tools/definitions/<slug>.ts and add it here. Run `npm run db:seed` to sync.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_DEFINITIONS: ToolDefinition<any>[] = [listingClipsTool, photoPricingGuideTool];

export function findToolBySlug(slug: string): ToolDefinition | undefined {
  return (TOOL_DEFINITIONS as ToolDefinition[]).find((t) => t.slug === slug);
}
