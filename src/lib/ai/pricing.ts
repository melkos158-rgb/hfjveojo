import { env } from "@/lib/env";

/**
 * USD per 1M tokens. DEFAULTS ARE A STARTING POINT — verify against the provider's pricing page and override
 * via AI_PRICE_TABLE_JSON in production. Unknown models fall back to the most expensive known rate so cost
 * is over-estimated, never under-estimated.
 */
const DEFAULT_PRICES: Record<string, { in: number; out: number }> = {
  "gpt-4.1-nano": { in: 0.1, out: 0.4 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4.1": { in: 2.0, out: 8.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-5-nano": { in: 0.05, out: 0.4 },
  "gpt-5-mini": { in: 0.25, out: 2.0 },
  "gpt-5": { in: 1.25, out: 10.0 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4.0 },
  "claude-sonnet-4-5": { in: 3.0, out: 15.0 },
  mock: { in: 0, out: 0 },
};

const FALLBACK = { in: 3.0, out: 15.0 };

let table: Record<string, { in: number; out: number }> | null = null;

export function priceTable(): Record<string, { in: number; out: number }> {
  if (table) return table;
  table = { ...DEFAULT_PRICES };
  const override = env().AI_PRICE_TABLE_JSON;
  if (override) {
    try {
      Object.assign(table, JSON.parse(override));
    } catch {
      // ignore malformed override; defaults stay
    }
  }
  return table;
}

/** Cost in micro-dollars (1e-6 USD) so integers stay exact. 1 cent = 10,000 micros. */
export function costMicros(model: string, inputTokens: number, outputTokens: number): number {
  const p = priceTable()[model] ?? FALLBACK;
  const usd = (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
  return Math.ceil(usd * 1_000_000);
}

export function microsToCents(micros: number): number {
  return micros / 10_000;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
