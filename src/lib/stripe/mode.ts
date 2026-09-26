import { env, type Env } from "@/lib/env";

/**
 * Stripe test (sandbox) and live keys side by side. Customer checkouts use STRIPE_MODE; everything else that talks
 * to Stripe picks the mode of the thing it handles — a webhook event's `livemode`, an order's `livemode` — so test and
 * live never mix: a sandbox payment can never mark a live order paid, and a refund always goes to the account that
 * took the money. Only key PREFIXES are ever inspected here; values are never logged or returned.
 */
export type StripeMode = "test" | "live";

type StripeEnv = Pick<Env, "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET" | "STRIPE_LIVE_SECRET_KEY" | "STRIPE_LIVE_WEBHOOK_SECRET" | "STRIPE_MODE">;

export function keyMode(key: string | null | undefined): StripeMode | null {
  if (!key) return null;
  if (/^(sk|rk)_live_/.test(key)) return "live";
  if (/^(sk|rk)_test_/.test(key)) return "test";
  return null;
}

/** The secret key for a mode, looked up by prefix (so a live key pasted into STRIPE_SECRET_KEY is still treated as live). */
export function secretKeyFor(mode: StripeMode, e: StripeEnv = env()): string | null {
  for (const key of [e.STRIPE_LIVE_SECRET_KEY, e.STRIPE_SECRET_KEY]) if (keyMode(key) === mode) return key;
  return null;
}

/** Name of the variable holding the key for a mode (for the admin page — never the value). */
export function secretKeyVarFor(mode: StripeMode, e: StripeEnv = env()): string | null {
  if (keyMode(e.STRIPE_LIVE_SECRET_KEY) === mode) return "STRIPE_LIVE_SECRET_KEY";
  if (keyMode(e.STRIPE_SECRET_KEY) === mode) return "STRIPE_SECRET_KEY";
  return null;
}

/** Every configured signing secret. A webhook is genuine when any of them verifies it; its `livemode` then decides the mode. */
export function webhookSecrets(e: StripeEnv = env()): string[] {
  return [...new Set([e.STRIPE_LIVE_WEBHOOK_SECRET, e.STRIPE_WEBHOOK_SECRET].filter((s): s is string => Boolean(s && s.trim())))];
}

/** The mode customer checkouts use. */
export function checkoutMode(e: StripeEnv = env()): StripeMode {
  return e.STRIPE_MODE;
}

/**
 * Production orders taken with a sandbox key moved no money: they are flagged as test so they never count as revenue
 * (dev/test environments keep counting them, so the dashboards can be exercised locally).
 */
export function isTestOrder(mode: StripeMode, explicit: boolean | undefined, appEnv: string = env().APP_ENV): boolean {
  return Boolean(explicit) || (appEnv === "production" && mode === "test");
}

export type StripeConfigSummary = {
  checkoutMode: StripeMode;
  test: { keyVar: string | null; webhookSecret: boolean };
  live: { keyVar: string | null; webhookSecret: boolean };
  problems: string[];
};

/** What is configured, as names and booleans only — safe to render on the admin page. */
export function stripeConfigSummary(e: StripeEnv = env()): StripeConfigSummary {
  const liveKeyVar = secretKeyVarFor("live", e);
  const testKeyVar = secretKeyVarFor("test", e);
  const problems: string[] = [];
  if (e.STRIPE_MODE === "live" && !liveKeyVar) problems.push("STRIPE_MODE=live but no live secret key is set — checkouts will fail. Add STRIPE_LIVE_SECRET_KEY or switch back to test.");
  if (e.STRIPE_MODE === "live" && !e.STRIPE_LIVE_WEBHOOK_SECRET) problems.push("STRIPE_MODE=live but STRIPE_LIVE_WEBHOOK_SECRET is missing — live payments would never be marked paid.");
  if (e.STRIPE_LIVE_SECRET_KEY && keyMode(e.STRIPE_LIVE_SECRET_KEY) !== "live") problems.push("STRIPE_LIVE_SECRET_KEY does not start with sk_live_ or rk_live_.");
  if (keyMode(e.STRIPE_SECRET_KEY) === "live") problems.push("STRIPE_SECRET_KEY holds a live key; keep the sandbox key there and put the live key in STRIPE_LIVE_SECRET_KEY.");
  if (liveKeyVar && !e.STRIPE_LIVE_WEBHOOK_SECRET) problems.push("Live key present but STRIPE_LIVE_WEBHOOK_SECRET is not set yet.");
  if (e.STRIPE_LIVE_WEBHOOK_SECRET && e.STRIPE_LIVE_WEBHOOK_SECRET === e.STRIPE_WEBHOOK_SECRET) problems.push("The live and sandbox webhook secrets are identical — the live destination must have its own signing secret.");
  return {
    checkoutMode: e.STRIPE_MODE,
    test: { keyVar: testKeyVar, webhookSecret: Boolean(e.STRIPE_WEBHOOK_SECRET) && keyMode(e.STRIPE_SECRET_KEY) !== "live" },
    live: { keyVar: liveKeyVar, webhookSecret: Boolean(e.STRIPE_LIVE_WEBHOOK_SECRET) },
    problems,
  };
}
