import { env } from "@/lib/env";
import { AiProviderError, type AiProvider, type CompletionRequest, type CompletionResult } from "@/lib/ai/types";

/**
 * Anthropic Messages API over plain fetch (no SDK dependency). Used as fallback or primary via AI_PROVIDER.
 * JSON-schema requests are enforced by instruction + post-validation in the caller (completeStructured).
 */
export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const key = env().ANTHROPIC_API_KEY;
    if (!key) throw new AiProviderError("ANTHROPIC_API_KEY is not set", { retryable: false });
    const started = Date.now();
    const system = req.jsonSchema
      ? `${req.system}\n\nRespond with ONLY a JSON object matching this JSON Schema (no prose, no code fences):\n${JSON.stringify(req.jsonSchema.schema)}`
      : req.system;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxOutputTokens ?? 4000,
        temperature: req.temperature ?? 0.4,
        system,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new AiProviderError(`Anthropic error ${res.status}: ${body.slice(0, 300)}`, {
        retryable: res.status === 429 || res.status >= 500,
        status: res.status,
      });
    }
    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      model?: string;
    };
    const text = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    if (!text) throw new AiProviderError("Empty completion from Anthropic", { retryable: true });
    return {
      text: text.replace(/^```(?:json)?\s*|\s*```$/g, ""),
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      model: data.model ?? req.model,
      provider: "anthropic",
      latencyMs: Date.now() - started,
    };
  },
};
