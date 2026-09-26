import OpenAI, { toFile } from "openai";
import { editSizeFor, wantsInputFidelity } from "@/lib/ai/image-size";
import { env } from "@/lib/env";
import { AiProviderError, type AiProvider, type CompletionRequest, type CompletionResult, type ImageEditRequest, type ImageEditResult } from "@/lib/ai/types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = env().OPENAI_API_KEY;
    if (!key) throw new AiProviderError("OPENAI_API_KEY is not set", { retryable: false });
    client = new OpenAI({ apiKey: key, maxRetries: 2, timeout: 120_000 });
  }
  return client;
}

/** Reasoning models reject temperature; only pass it for classic chat models. */
function supportsTemperature(model: string): boolean {
  return !/^(gpt-5|o\d)/.test(model);
}

export const openAiProvider: AiProvider = {
  name: "openai",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const started = Date.now();
    try {
      const res = await getClient().chat.completions.create({
        model: req.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        max_completion_tokens: req.maxOutputTokens ?? 4000,
        ...(supportsTemperature(req.model) ? { temperature: req.temperature ?? 0.4 } : {}),
        ...(req.jsonSchema
          ? {
              response_format: {
                type: "json_schema" as const,
                json_schema: { name: req.jsonSchema.name, schema: req.jsonSchema.schema, strict: false },
              },
            }
          : {}),
      });
      const choice = res.choices[0];
      const text = choice?.message?.content ?? "";
      if (!text) throw new AiProviderError("Empty completion from OpenAI", { retryable: true });
      return {
        text,
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
        model: res.model ?? req.model,
        provider: "openai",
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      const status = (err as { status?: number }).status;
      const retryable = !status || status === 429 || status >= 500;
      throw new AiProviderError(`OpenAI error: ${(err as Error).message}`, { retryable, status });
    }
  },

  async editImage(req: ImageEditRequest): Promise<ImageEditResult> {
    const started = Date.now();
    try {
      const ext = req.mime === "image/png" ? "png" : req.mime === "image/webp" ? "webp" : "jpg";
      const file = await toFile(req.image, `room.${ext}`, { type: req.mime });
      const res = await getClient().images.edit({
        model: req.model,
        image: file,
        prompt: req.prompt,
        n: req.n,
        // "auto" → the photo's own proportions on models that take any WIDTHxHEIGHT (the SDK type lists only the fixed sizes)
        size: (req.size === "auto" ? editSizeFor(req.model, req.inputWidth, req.inputHeight) : req.size) as "auto",
        quality: req.quality,
        ...(wantsInputFidelity(req.model) ? { input_fidelity: "high" as const } : {}),
      });
      const images: Buffer[] = [];
      for (const d of res.data ?? []) if (d.b64_json) images.push(Buffer.from(d.b64_json, "base64"));
      if (images.length === 0) throw new AiProviderError("Image model returned no images", { retryable: true });
      return { images, model: req.model, provider: "openai", latencyMs: Date.now() - started };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      const e = err as { status?: number; message?: string };
      const status = e.status;
      const retryable = status === undefined || status === 429 || status >= 500;
      throw new AiProviderError(`OpenAI images: ${e.message ?? "request failed"}`, { retryable, status });
    }
  },
};
