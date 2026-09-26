import Stripe from "stripe";
import { AppError } from "@/lib/errors";
import { checkoutMode, secretKeyFor, type StripeMode } from "@/lib/stripe/mode";

const instances: Partial<Record<StripeMode, Stripe>> = {};

/**
 * Server-only Stripe client for a mode (default: the customer checkout mode, STRIPE_MODE). The secret key never
 * leaves the server (no NEXT_PUBLIC_ prefix, ever). Callers that handle an existing object pass its mode explicitly:
 * a webhook event's `livemode`, an order's `livemode`.
 */
export function stripe(mode: StripeMode = checkoutMode()): Stripe {
  const cached = instances[mode];
  if (cached) return cached;
  const key = secretKeyFor(mode);
  if (!key) throw new AppError(`Stripe ${mode} mode is not configured on this server`, 503, "stripe_not_configured");
  const client = new Stripe(key, {
    typescript: true,
    appInfo: { name: "ORVIONIS", url: "https://orvionis.com" },
    maxNetworkRetries: 2,
  });
  instances[mode] = client;
  return client;
}
