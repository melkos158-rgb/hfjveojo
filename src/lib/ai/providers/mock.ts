import type { AiProvider, CompletionRequest, CompletionResult } from "@/lib/ai/types";

/**
 * Deterministic provider for tests, CI and local development without API keys.
 * It fills a JSON schema with plausible values (re-using prices and names found in the prompt) so the
 * whole pipeline — QA rules, PDF rendering, delivery — runs exactly as it would with a real model.
 */
const FILLER =
  "This is sample copy produced by the mock AI provider. It exists so the full pipeline can run in tests and local development without an API key, and it is long enough to pass the minimum-length quality rule that real deliverables must satisfy.";

type Hints = { prices: string[]; priceIdx: number };

function sample(schema: Record<string, unknown>, hints: Hints, keyHint = "", depth = 0): unknown {
  const type = schema.type as string | string[] | undefined;
  const t = Array.isArray(type) ? type[0] : type;
  if (schema.enum && Array.isArray(schema.enum)) return schema.enum[0];
  switch (t) {
    case "object": {
      const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) out[k] = sample(v, hints, k, depth + 1);
      return out;
    }
    case "array": {
      const items = (schema.items ?? { type: "string" }) as Record<string, unknown>;
      const min = typeof schema.minItems === "number" ? schema.minItems : 3;
      const max = typeof schema.maxItems === "number" ? schema.maxItems : Math.max(min, 3);
      const n = Math.min(Math.max(min, Math.min(3, max)), max);
      return Array.from({ length: n }, (_, i) => sample(items, hints, `${keyHint}_${i + 1}`, depth + 1));
    }
    case "number":
    case "integer": {
      const min = typeof schema.minimum === "number" ? schema.minimum : 1;
      return keyHint === "number" ? (Number(keyHint.split("_").pop()) || min) : min;
    }
    case "boolean":
      return true;
    default: {
      if (keyHint === "price" && hints.prices.length > 0) {
        const p = hints.prices[hints.priceIdx % hints.prices.length];
        hints.priceIdx++;
        return p;
      }
      if (/^(about|philosophy|description|text|a|caption|editorNotes)$/.test(keyHint)) return FILLER;
      return `Sample ${keyHint.replace(/_\d+$/, "") || "text"} ${keyHint.match(/_(\d+)$/)?.[1] ?? ""}`.trim();
    }
  }
}

export const mockProvider: AiProvider = {
  name: "mock",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const hints: Hints = { prices: req.user.match(/\$[\d,]+(?:\.\d+)?/g) ?? [], priceIdx: 0 };
    const text = req.jsonSchema
      ? JSON.stringify(sample(req.jsonSchema.schema, hints))
      : `SUMMARY: Mock summary — no real model was called. The numbers above are authoritative.\nACTIONS:\n1. Configure a real AI provider.\n2. Send the first 20 outreach messages.\n3. Review the order queue.`;
    return {
      text,
      inputTokens: Math.ceil((req.system.length + req.user.length) / 4),
      outputTokens: Math.ceil(text.length / 4),
      model: "mock",
      provider: "mock",
      latencyMs: 1,
    };
  },
};
