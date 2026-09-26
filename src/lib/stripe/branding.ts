import { join } from "node:path";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { env, appUrl } from "@/lib/env";
import { site } from "@/config/site";

/** What the checkout page and Stripe receipts should look like — the same tokens as globals.css. */
export const STRIPE_BRAND = {
  name: site.name,
  primaryColor: "#08090D", // page/header background on Checkout
  secondaryColor: "#8B5CF6", // buttons and links
  iconPath: join("public", "brand", "icon-512.png"),
};

export type StripeAccountSummary = {
  id: string;
  /** Dashboard/sandbox name — makes a wrong key obvious ("Ride Lab" vs "orvionis sandbox"). */
  displayName: string | null;
  mode: "live" | "test";
  businessName: string | null;
  supportEmail: string | null;
  url: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  hasIcon: boolean;
  chargesEnabled: boolean;
  matches: boolean;
};

function summarize(acct: Stripe.Account): StripeAccountSummary {
  const b = acct.settings?.branding;
  const primary = b?.primary_color ?? null;
  const secondary = b?.secondary_color ?? null;
  const hasIcon = Boolean(b?.icon);
  return {
    id: acct.id,
    displayName: acct.settings?.dashboard?.display_name ?? null,
    mode: env().STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : "test",
    businessName: acct.business_profile?.name ?? null,
    supportEmail: acct.business_profile?.support_email ?? null,
    url: acct.business_profile?.url ?? null,
    primaryColor: primary,
    secondaryColor: secondary,
    hasIcon,
    chargesEnabled: Boolean(acct.charges_enabled),
    matches:
      (acct.business_profile?.name ?? "") === STRIPE_BRAND.name &&
      (primary ?? "").toLowerCase() === STRIPE_BRAND.primaryColor.toLowerCase() &&
      (secondary ?? "").toLowerCase() === STRIPE_BRAND.secondaryColor.toLowerCase() &&
      hasIcon,
  };
}

/** The account behind STRIPE_SECRET_KEY, as the customer will see it on Checkout and receipts. */
export async function stripeAccountSummary(): Promise<StripeAccountSummary> {
  const acct = await stripe().accounts.retrieveCurrent();
  return summarize(acct);
}

export type StripeWebhookCheck = { url: string; found: boolean; status?: string; enabledEvents?: string[]; missingEvents: string[]; others: number };

/** The events the app handles (src/lib/stripe/webhooks.ts) — the destination must subscribe to all of them. */
export const REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
];

/**
 * Is there a webhook destination on the key's account that points at this deployment? A key from one
 * sandbox and a webhook on another means Checkout works but orders are never marked paid — this catches it.
 */
export async function stripeWebhookCheck(): Promise<StripeWebhookCheck> {
  const url = appUrl("/api/stripe/webhook");
  const list = await stripe().webhookEndpoints.list({ limit: 100 });
  const mine = list.data.find((w) => w.url === url);
  if (!mine) return { url, found: false, missingEvents: REQUIRED_WEBHOOK_EVENTS, others: list.data.length };
  const enabled = mine.enabled_events;
  const all = enabled.includes("*");
  return {
    url,
    found: true,
    status: mine.status,
    enabledEvents: enabled,
    missingEvents: all ? [] : REQUIRED_WEBHOOK_EVENTS.filter((e) => !enabled.includes(e)),
    others: list.data.length - 1,
  };
}
