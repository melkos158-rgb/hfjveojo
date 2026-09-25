import Stripe from "stripe";
import { env } from "@/lib/env";

let instance: Stripe | null = null;

/** Server-only Stripe client. The secret key never leaves the server (no NEXT_PUBLIC_ prefix, ever). */
export function stripe(): Stripe {
  if (!instance) {
    instance = new Stripe(env().STRIPE_SECRET_KEY, {
      typescript: true,
      appInfo: { name: "ORVIONIS", url: "https://orvionis.com" },
      maxNetworkRetries: 2,
    });
  }
  return instance;
}
