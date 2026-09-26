import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { costMicros } from "@/lib/ai/pricing";
import { openAiProvider } from "@/lib/ai/providers/openai";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import { mockProvider } from "@/lib/ai/providers/mock";
import { AiProviderError, type AiProvider, type AiTier, type CompletionResult, type ImageEditRequest } from "@/lib/ai/types";
import { AppError } from "@/lib/errors";

export type AiCallContext = {
  purpose: string; // generate | qa | report | ...
  orderId?: string | null;
  toolRunId?: string | null;
  toolId?: string | null;
  userId?: string | null;
};

export type AiCall = {
  tier: AiTier;
  system: string;
  user: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export class AiBudgetExceededError extends AppError {
  constructor(message: string) {
    super(message, 503, "ai_budget_exceeded");
  }
}

function providerFor(name: string): AiProvider {
  if (name === "anthropic") return anthropicProvider;
  if (name === "mock") return mockProvider;
  return openAiProvider;
}

function modelFor(tier: AiTier, providerName: string): string {
  const e = env();
  if (providerName === "mock") return "mock";
  if (providerName === "anthropic") {
    return tier === "cheap" ? "claude-3-5-haiku-latest" : "claude-sonnet-4-5";
  }
  return tier === "cheap" ? e.AI_MODEL_CHEAP : tier === "standard" ? e.AI_MODEL_STANDARD : e.AI_MODEL_BEST;
}

/** Sum of today's AI spend (UTC day) in micro-dollars. */
export async function todaysSpendMicros(): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.aiRequest.aggregate({ _sum: { costMicros: true }, where: { createdAt: { gte: start } } });
  return agg._sum.costMicros ?? 0;
}

async function orderSpendMicros(orderId: string): Promise<number> {
  const agg = await prisma.aiRequest.aggregate({ _sum: { costMicros: true }, where: { orderId } });
  return agg._sum.costMicros ?? 0;
}

/** Hard budget guards: daily cap + per-order cap. Both are env-configurable; the kill switch lives in Settings. */
async function assertBudget(ctx: AiCallContext): Promise<void> {
  const e = env();
  const kill = await prisma.setting.findUnique({ where: { key: "ai.kill_switch" } });
  if (kill && kill.value === true) throw new AiBudgetExceededError("AI kill switch is on (Settings ai.kill_switch)");
  const daily = await todaysSpendMicros();
  if (e.AI_DAILY_BUDGET_CENTS > 0 && daily >= e.AI_DAILY_BUDGET_CENTS * 10_000) {
    throw new AiBudgetExceededError(`Daily AI budget of ${e.AI_DAILY_BUDGET_CENTS} cents reached`);
  }
  if (ctx.orderId && e.AI_MAX_COST_PER_ORDER_CENTS > 0) {
    const spent = await orderSpendMicros(ctx.orderId);
    if (spent >= e.AI_MAX_COST_PER_ORDER_CENTS * 10_000) {
      throw new AiBudgetExceededError(`Per-order AI budget reached for order ${ctx.orderId}`);
    }
  }
}

async function record(ctx: AiCallContext, tier: AiTier, res: CompletionResult | null, err?: Error, model?: string, provider?: string) {
  const micros = res ? costMicros(res.model, res.inputTokens, res.outputTokens) : 0;
  await prisma.aiRequest.create({
    data: {
      orderId: ctx.orderId ?? undefined,
      toolRunId: ctx.toolRunId ?? undefined,
      toolId: ctx.toolId ?? undefined,
      userId: ctx.userId ?? undefined,
      provider: res?.provider ?? provider ?? "unknown",
      model: res?.model ?? model ?? "unknown",
      tier,
      purpose: ctx.purpose,
      inputTokens: res?.inputTokens ?? 0,
      outputTokens: res?.outputTokens ?? 0,
      costMicros: micros,
      latencyMs: res?.latencyMs ?? 0,
      ok: !err,
      error: err?.message.slice(0, 1000),
    },
  });
  return micros;
}

/**
 * Text completion with provider routing, fallback and cost logging.
 * Returns the text plus the cost so callers can accumulate per-run costs.
 */
export async function complete(call: AiCall, ctx: AiCallContext): Promise<{ text: string; costMicros: number }> {
  await assertBudget(ctx);
  const e = env();
  const primaryName = e.AI_PROVIDER;
  const chain: string[] = [primaryName];
  if (primaryName === "openai" && e.ANTHROPIC_API_KEY) chain.push("anthropic");
  if (primaryName === "anthropic" && e.OPENAI_API_KEY) chain.push("openai");

  let lastErr: Error | null = null;
  for (const name of chain) {
    const provider = providerFor(name);
    const model = modelFor(call.tier, name);
    try {
      const res = await provider.complete({
        system: call.system,
        user: call.user,
        model,
        maxOutputTokens: call.maxOutputTokens,
        temperature: call.temperature,
      });
      const micros = await record(ctx, call.tier, res);
      return { text: res.text, costMicros: micros };
    } catch (err) {
      lastErr = err as Error;
      await record(ctx, call.tier, null, lastErr, model, name);
      const retryable = err instanceof AiProviderError ? err.retryable : true;
      log.warn("ai.provider_failed", { provider: name, model, retryable, error: lastErr.message });
      if (!retryable) break;
    }
  }
  throw lastErr ?? new Error("AI completion failed");
}

/**
 * Structured completion: JSON Schema-constrained output, parsed and validated by the caller's zod schema.
 */
export async function completeStructured<T>(
  call: AiCall & { schemaName: string; jsonSchema: Record<string, unknown>; parse: (raw: unknown) => T },
  ctx: AiCallContext,
): Promise<{ data: T; costMicros: number }> {
  await assertBudget(ctx);
  const e = env();
  const primaryName = e.AI_PROVIDER;
  const chain: string[] = [primaryName];
  if (primaryName === "openai" && e.ANTHROPIC_API_KEY) chain.push("anthropic");
  if (primaryName === "anthropic" && e.OPENAI_API_KEY) chain.push("openai");

  let lastErr: Error | null = null;
  for (const name of chain) {
    const provider = providerFor(name);
    const model = modelFor(call.tier, name);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await provider.complete({
          system: call.system,
          user: call.user,
          model,
          maxOutputTokens: call.maxOutputTokens,
          temperature: call.temperature,
          jsonSchema: { name: call.schemaName, schema: call.jsonSchema },
        });
        const micros = await record(ctx, call.tier, res);
        let raw: unknown;
        try {
          raw = JSON.parse(res.text);
        } catch {
          throw new AiProviderError("Model returned non-JSON output", { retryable: true });
        }
        const data = call.parse(raw);
        return { data, costMicros: micros };
      } catch (err) {
        lastErr = err as Error;
        const retryable = err instanceof AiProviderError ? err.retryable : true;
        log.warn("ai.structured_failed", { provider: name, model, attempt, error: lastErr.message });
        if (!retryable) break;
      }
    }
  }
  throw lastErr ?? new Error("AI structured completion failed");
}

export type ImageEditCall = Omit<ImageEditRequest, "model" | "quality"> & { quality?: ImageEditRequest["quality"] };

/**
 * Image-to-image edit with the same budget guard and cost logging as text calls. Cost is a per-image
 * estimate (AI_IMAGE_COST_CENTS) because image models bill per image, not per token.
 */
export async function editImage(call: ImageEditCall, ctx: AiCallContext): Promise<{ images: Buffer[]; costMicros: number }> {
  await assertBudget(ctx);
  const e = env();
  const provider = providerFor(e.AI_PROVIDER === "anthropic" ? "openai" : e.AI_PROVIDER); // Anthropic has no image edit; OpenAI does
  const model = e.AI_PROVIDER === "mock" ? "mock" : e.AI_IMAGE_MODEL;
  if (!provider.editImage) throw new AiProviderError(`Provider ${provider.name} cannot edit images`, { retryable: false });
  const started = Date.now();
  try {
    const res = await provider.editImage({ ...call, model, quality: call.quality ?? e.AI_IMAGE_QUALITY });
    const micros = provider.name === "mock" ? 0 : Math.round(e.AI_IMAGE_COST_CENTS * 10_000 * res.images.length + 10_000);
    await prisma.aiRequest.create({
      data: {
        orderId: ctx.orderId ?? undefined,
        toolRunId: ctx.toolRunId ?? undefined,
        toolId: ctx.toolId ?? undefined,
        userId: ctx.userId ?? undefined,
        provider: res.provider,
        model: res.model,
        tier: "standard",
        purpose: ctx.purpose,
        costMicros: micros,
        latencyMs: res.latencyMs,
        ok: true,
      },
    });
    return { images: res.images, costMicros: micros };
  } catch (err) {
    const e2 = err as Error;
    await prisma.aiRequest.create({
      data: {
        orderId: ctx.orderId ?? undefined,
        toolRunId: ctx.toolRunId ?? undefined,
        toolId: ctx.toolId ?? undefined,
        userId: ctx.userId ?? undefined,
        provider: provider.name,
        model,
        tier: "standard",
        purpose: ctx.purpose,
        latencyMs: Date.now() - started,
        ok: false,
        error: e2.message.slice(0, 1000),
      },
    });
    log.warn("ai.image_failed", { provider: provider.name, model, error: e2.message });
    throw err;
  }
}
