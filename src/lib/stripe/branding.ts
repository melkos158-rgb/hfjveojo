import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { env, appUrl } from "@/lib/env";
import { site } from "@/config/site";
import { log } from "@/lib/logger";

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

/**
 * Pushes the ORVIONIS name, colours and icon to the Stripe account so Checkout stops showing the old
 * business name. Idempotent: re-uploads the icon only when none is set. Uses the key already in the
 * environment — no secret is read or shown anywhere. Stripe may refuse some fields for an account that
 * has not finished activation; the error text is returned to the admin, nothing is retried blindly.
 */
export async function applyStripeBranding(): Promise<{ ok: boolean; message: string; after?: StripeAccountSummary }> {
  const s = stripe();
  try {
    const before = await s.accounts.retrieveCurrent();
    let iconId = before.settings?.branding?.icon ?? null;
    if (typeof iconId !== "string") iconId = (iconId as Stripe.File | null)?.id ?? null;
    if (!iconId) {
      const data = await readFile(join(process.cwd(), STRIPE_BRAND.iconPath));
      const file = await s.files.create({ purpose: "business_icon", file: { data, name: "orvionis-icon.png", type: "application/octet-stream" } });
      iconId = file.id;
    }
    const after = await s.accounts.update(before.id, {
      business_profile: { name: STRIPE_BRAND.name, support_email: site.supportEmail, url: site.url, support_url: `${site.url}/contact` },
      settings: { branding: { primary_color: STRIPE_BRAND.primaryColor, secondary_color: STRIPE_BRAND.secondaryColor, icon: iconId } },
    });
    log.info("stripe.branding_applied", { account: after.id });
    return { ok: true, message: `Applied to ${after.id}: name "${after.business_profile?.name}", colours, icon.`, after: summarize(after) };
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    log.warn("stripe.branding_failed", { error: message });
    return { ok: false, message: `Stripe refused: ${message.slice(0, 300)}` };
  }
}
