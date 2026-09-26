import { join } from "node:path";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { appUrl } from "@/lib/env";
import { site } from "@/config/site";
import { keyMode, secretKeyFor, type StripeMode } from "@/lib/stripe/mode";

/** What the checkout page and Stripe receipts should look like — the same tokens as globals.css. */
export const STRIPE_BRAND = {
  name: site.name,
  primaryColor: "#08090D", // page/header background on Checkout
  secondaryColor: "#8B5CF6", // buttons and links
  /** Uploaded in the Dashboard (Settings → Business → Branding) as both Icon and Logo — the official mark, docs/BRAND.md. */
  iconPath: join("public", "brand", "orvionis-mark-512.png"),
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
  hasLogo: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** Stripe's open requirements (e.g. "individual.verification.document") — why charges/payouts may still be off. */
  requirementsDue: string[];
  disabledReason: string | null;
  matches: boolean;
};

function summarize(acct: Stripe.Account, mode: StripeMode): StripeAccountSummary {
  const b = acct.settings?.branding;
  const primary = b?.primary_color ?? null;
  const secondary = b?.secondary_color ?? null;
  const hasIcon = Boolean(b?.icon);
  const hasLogo = Boolean(b?.logo);
  return {
    id: acct.id,
    displayName: acct.settings?.dashboard?.display_name ?? null,
    mode,
    businessName: acct.business_profile?.name ?? null,
    supportEmail: acct.business_profile?.support_email ?? null,
    url: acct.business_profile?.url ?? null,
    primaryColor: primary,
    secondaryColor: secondary,
    hasIcon,
    hasLogo,
    chargesEnabled: Boolean(acct.charges_enabled),
    payoutsEnabled: Boolean(acct.payouts_enabled),
    detailsSubmitted: Boolean(acct.details_submitted),
    requirementsDue: [...(acct.requirements?.currently_due ?? []), ...(acct.requirements?.past_due ?? [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12),
    disabledReason: acct.requirements?.disabled_reason ?? null,
    matches:
      (acct.business_profile?.name ?? "") === STRIPE_BRAND.name &&
      (primary ?? "").toLowerCase() === STRIPE_BRAND.primaryColor.toLowerCase() &&
      (secondary ?? "").toLowerCase() === STRIPE_BRAND.secondaryColor.toLowerCase() &&
      hasIcon,
  };
}

/** The account behind a mode's key, as the customer will see it on Checkout and receipts. */
export async function stripeAccountSummary(mode: StripeMode): Promise<StripeAccountSummary> {
  const key = secretKeyFor(mode);
  const acct = await stripe(mode).accounts.retrieveCurrent();
  return summarize(acct, keyMode(key) ?? mode);
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
 * Is there a webhook destination on the mode's account that points at this deployment? A key from one
 * sandbox and a webhook on another means Checkout works but orders are never marked paid — this catches it.
 */
export async function stripeWebhookCheck(mode: StripeMode): Promise<StripeWebhookCheck> {
  const url = appUrl("/api/stripe/webhook");
  const list = await stripe(mode).webhookEndpoints.list({ limit: 100 });
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

/**
 * Create the webhook destination for this deployment on a mode's account, or bring an existing one up to date
 * (exactly the events the app handles, enabled). Stripe returns the signing secret only on creation: it is
 * deliberately dropped here — the owner reveals it in the Stripe Dashboard and stores it as a Railway variable.
 */
export async function ensureWebhookEndpoint(mode: StripeMode): Promise<{ action: "created" | "updated" | "unchanged"; id: string }> {
  const url = appUrl("/api/stripe/webhook");
  const client = stripe(mode);
  const list = await client.webhookEndpoints.list({ limit: 100 });
  const mine = list.data.find((w) => w.url === url);
  if (!mine) {
    const created = await client.webhookEndpoints.create({
      url,
      enabled_events: REQUIRED_WEBHOOK_EVENTS as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
      description: `${site.name} production (${mode})`,
      api_version: Stripe.API_VERSION as Stripe.WebhookEndpointCreateParams.ApiVersion,
    });
    return { action: "created", id: created.id };
  }
  const missing = mine.enabled_events.includes("*") ? [] : REQUIRED_WEBHOOK_EVENTS.filter((e) => !mine.enabled_events.includes(e));
  if (missing.length === 0 && mine.status === "enabled") return { action: "unchanged", id: mine.id };
  await client.webhookEndpoints.update(mine.id, {
    enabled_events: [...new Set([...mine.enabled_events.filter((e) => e !== "*"), ...REQUIRED_WEBHOOK_EVENTS])] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
    disabled: false,
  });
  return { action: "updated", id: mine.id };
}

/**
 * Prove a mode's webhook path end to end without charging anyone: open a Checkout Session and expire it at once.
 * Stripe then sends a signed `checkout.session.expired` for that mode; when it shows up under "last event" on the
 * admin page, the destination, its signing secret on this server and the handler all work.
 */
export async function sendWebhookProbe(mode: StripeMode): Promise<{ sessionId: string }> {
  const client = stripe(mode);
  const session = await client.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: 100, product_data: { name: `${site.name} webhook check (not for sale)` } } }],
    metadata: { purpose: "webhook_probe" },
    success_url: appUrl("/"),
    cancel_url: appUrl("/"),
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  await client.checkout.sessions.expire(session.id);
  return { sessionId: session.id };
}
