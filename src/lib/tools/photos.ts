import type { ToolDefinition } from "@/lib/tools/types";

export type PhotoInput = { fileId: string; label: string };

/**
 * The uploaded photos an order carries: the tool's own `photoInputs` (e.g. several rooms) when it has one, otherwise
 * every single-image field. Works on stored intakes of any age — the tool schema migrates old shapes.
 */
export function photoInputsOf(def: ToolDefinition<unknown> | undefined, intake: unknown): PhotoInput[] {
  if (!def) return [];
  if (def.photoInputs) {
    const parsed = def.intake.schema.safeParse(intake);
    if (parsed.success) return def.photoInputs(parsed.data);
  }
  const raw = (intake ?? {}) as Record<string, unknown>;
  return def.intake.fields
    .filter((f) => f.type === "image")
    .map((f) => ({ fileId: raw[f.key], label: f.label }))
    .filter((p): p is PhotoInput => typeof p.fileId === "string" && p.fileId.length > 0);
}

/** Units to charge for an intake (e.g. photos). Re-validated here: an intake the tool rejects never multiplies the price. */
export function quantityOf(def: ToolDefinition<unknown>, intake: unknown): number {
  if (!def.quantity) return 1;
  const parsed = def.intake.schema.safeParse(intake);
  if (!parsed.success) return 1;
  const q = def.quantity(parsed.data);
  return Number.isInteger(q) && q >= 1 && q <= 50 ? q : 1;
}
