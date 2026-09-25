import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { reportError } from "@/lib/errors";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Stripe → server. Signature is verified against the RAW body; unsigned or tampered requests are rejected.
 * Returning non-2xx makes Stripe retry, which is what we want on transient failures.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, env().STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.warn("stripe.bad_signature", { error: (err as Error).message });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const res = await handleStripeEvent(event);
    return Response.json({ received: true, duplicate: res.duplicate });
  } catch (err) {
    await reportError(err, { eventId: event.id, type: event.type });
    return new Response("Handler error", { status: 500 });
  }
}
