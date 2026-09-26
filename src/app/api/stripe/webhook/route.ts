import Stripe from "stripe";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { webhookSecrets } from "@/lib/stripe/mode";
import { reportError } from "@/lib/errors";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Stripe → server. The signature is verified against the RAW body with every configured signing secret (the
 * sandbox destination's and the live destination's); unsigned or tampered requests are rejected. Which mode the
 * event belongs to is then taken from the verified event itself (`livemode`), never from the request.
 * Returning non-2xx makes Stripe retry, which is what we want on transient failures.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();

  let event: Stripe.Event | null = null;
  for (const secret of webhookSecrets()) {
    try {
      event = Stripe.webhooks.constructEvent(raw, sig, secret);
      break;
    } catch {
      // try the next destination's secret
    }
  }
  if (!event) {
    log.warn("stripe.bad_signature", { secrets: webhookSecrets().length });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const res = await handleStripeEvent(event);
    return Response.json({ received: true, duplicate: res.duplicate });
  } catch (err) {
    await reportError(err, { eventId: event.id, type: event.type, livemode: event.livemode });
    return new Response("Handler error", { status: 500 });
  }
}
