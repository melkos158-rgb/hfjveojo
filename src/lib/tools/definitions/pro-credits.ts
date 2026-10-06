import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { CREDIT_MONTHS, CREDITS_PER_PACK } from "@/lib/orders/credit-rules";

/**
 * PRO CREDITS — 25 rooms of virtual staging paid once (court of agents, 2026-10-06, session 2, lever 3: "a
 * photographers and teams page with $149 Pro credits"). For people who stage every week but not in steady monthly
 * volumes: real-estate photographers who deliver staged photos to their agents, teams and coordinators.
 *
 * Buying it is an ordinary paid order of this tool; the pipeline needs no AI, it only writes the confirmation. The
 * balance is computed from the orders themselves (src/lib/orders/credits.ts): paid Pro credit orders of an email minus
 * the staging orders that email paid with credits. Staged photos carry no ORVIONIS mark (they never did), so buyers can
 * deliver them under their own name.
 */

const intakeSchema = z.object({
  businessName: z.string().trim().max(120).optional().default(""),
});

export type ProCreditsIntake = z.infer<typeof intakeSchema>;

const PRICE_CENTS = 14900;
const perRoom = (PRICE_CENTS / 100 / CREDITS_PER_PACK).toFixed(2);

export const proCreditsTool: ToolDefinition<ProCreditsIntake> = {
  id: "pro-credits",
  slug: "pro-credits",
  name: "Pro credits — 25 staged rooms",
  category: "photography",
  tagline: `25 rooms of AI virtual staging for $149 ($${perRoom} a room), paid once and used over ${CREDIT_MONTHS} months — for photographers and teams.`,
  description:
    "Prepaid virtual staging for real-estate photographers, teams and listing coordinators: 25 rooms, two staged versions of each, no subscription. Sign in with the email you buy with and the staging form shows your balance.",
  io: {
    input: "Your email (the credits are tied to it); a business name for the receipt if you like",
    output: "25 rooms of virtual staging on your account, usable for 12 months",
    processingTime: "Ready about a minute after payment",
    ctaLabel: "Get 25 rooms",
  },
  fulfillment: "AUTO",
  initialStatus: "LIVE",
  version: 1,
  intake: {
    schema: intakeSchema,
    fields: [{ key: "businessName", label: "Business or team name (optional, for your receipt)", type: "text", placeholder: "e.g. Bright Lens Real Estate Photo" }],
  },
  pricing: {
    sku: "PRO_CREDITS_25",
    name: "Pro credits — 25 rooms of virtual staging",
    priceCents: PRICE_CENTS,
    currency: "usd",
    compareAtText: "25 rooms at the single-room price ($15) would be $375",
  },
  sla: { deliveryHours: 1 },
  landing: {
    headline: "25 staged rooms for $149. No subscription.",
    subheadline: `For photographers and teams who stage every week but not the same amount every month: pay once, use the rooms over ${CREDIT_MONTHS} months, about $${perRoom} a room.`,
    bullets: [
      `25 rooms (photos), each with two staged versions — $${perRoom} a room instead of $15`,
      `No monthly fee and no credits lost at the end of a month: they last ${CREDIT_MONTHS} months from purchase`,
      "The staged photos carry no ORVIONIS mark, so you can deliver them to your agents under your own name",
      "Every room also comes with “Virtually staged” labeled copies for the MLS and an optional page with the original photo (on orvionis.com)",
      "Sign in with the email you bought with: the staging order form shows your balance and a “Use my Pro credits” box",
    ],
    howItWorks: [
      { title: "1. Buy the 25 rooms", text: "One payment of $149 through Stripe, with the email you'll use to order." },
      { title: "2. Sign in and order", text: "Sign in with that email, upload the room photos on the virtual staging page and keep “Use my Pro credits” ticked." },
      { title: "3. Deliver", text: "About two minutes per photo later you have two staged versions of each room, plus the labeled copies for the MLS." },
    ],
    faq: [
      {
        q: "Who is this for?",
        a: "Real-estate photographers who add staged photos to their shoots, and teams or coordinators with several vacant listings a month. If you stage one listing now and then, the whole-listing price ($49 for up to 5 rooms) is simpler.",
      },
      {
        q: "What does reselling look like?",
        a: `Each room costs you about $${perRoom}. For example, if you charge your agents $15 a staged photo you keep about $9 a room; at $25 about $19. You set your own price; the files have no ORVIONIS branding.`,
      },
      {
        q: "How does it compare with a monthly AI staging plan?",
        a: "A monthly plan can cost less per photo if you use every photo every month: Virtual Staging AI, for example, works out to $0.53–$4.17 a photo when every credit is used, at $25–$139 a month billed monthly (less with a year paid up front). Pro credits suit volume that goes up and down: one payment, no monthly fee, and the rooms last 12 months. Our cost guide lists the prices we checked.",
      },
      {
        q: "What happens if a result is wrong?",
        a: "The same rule as every staging order: if the room's structure was changed or a result is unusable, one redo is included. If the redo can't fix it, that order's rooms go back on your balance.",
      },
      {
        q: "Can my team share the credits?",
        a: "The credits belong to the email that bought them, so whoever signs in with it can use them. Several people can use one shared work address.",
      },
    ],
    ctaLabel: "Get 25 rooms — $149",
    // The same real result as the virtual staging page: what every room of the credits turns into.
    heroResult: {
      before: { src: "/img/hero-staging-before.webp", width: 700, height: 470, alt: "Before: an empty living room with three windows and an oak floor" },
      after: {
        src: "/img/hero-staging-after.webp",
        width: 700,
        height: 474,
        alt: "After: the same room virtually staged with a sofa, rug, coffee table, armchairs, a floor lamp and framed prints",
      },
      caption: "Real result: one room as our pipeline returned it, not retouched, with no logo on it. Each room of your credits gets two versions like this.",
    },
    deliveryPromise: "Your balance is ready about a minute after payment.",
    guarantee: "If the room's structure was changed or a result is unusable, one redo is included; if that can't fix it, the order's rooms go back on your balance. Unused credits: a full refund within 14 days of purchase if no room was used.",
    guides: [
      { href: "/guides/virtual-staging-cost", label: "What virtual staging costs in 2026" },
      { href: "/tools/virtual-staging", label: "Virtual staging — see real results" },
    ],
    sample: {
      label: "What you receive after paying",
      caption: "This is the confirmation every buyer gets; the balance shows on the staging form once you sign in.",
      input: ["Email: studio@example.com", "Business name: Bright Lens Real Estate Photo", "Payment: $149 through Stripe"],
      output: [
        { heading: "Your balance", text: "25 rooms of virtual staging, two staged versions of each room." },
        { heading: "Valid until", text: "12 months after the payment date, shown on your order page." },
        { heading: "How to use them", bullets: ["Sign in at orvionis.com with studio@example.com", "Open Virtual Staging and upload up to 10 room photos per order", "Keep “Use my Pro credits” ticked and start: no checkout"] },
      ],
    },
  },
  seo: {
    title: "Pro credits: 25 virtual staging rooms for $149, no subscription",
    description: "Prepaid AI virtual staging for real-estate photographers and teams: 25 rooms for $149 (about $5.96 each), two versions per room, unbranded files, 12 months to use them.",
    keywords: ["virtual staging for photographers", "virtual staging credits", "bulk virtual staging", "virtual staging wholesale", "real estate photographer virtual staging"],
    ogImage: "img/sample-virtual-staging-og.jpg",
  },
  delivery: {
    emailSubject: "Your 25 rooms of virtual staging are ready",
    emailIntro: `Your Pro credits are active: ${CREDITS_PER_PACK} rooms of virtual staging, valid for ${CREDIT_MONTHS} months. Sign in at orvionis.com with this email address, open Virtual Staging, and the order form shows your balance and a “Use my Pro credits” box.`,
  },
  async run(ctx) {
    const until = new Date(Date.now() + CREDIT_MONTHS * 30.44 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const name = ctx.intake.businessName ? ` for ${ctx.intake.businessName}` : "";
    const markdown = [
      `## Your Pro credits${name}`,
      "",
      `- **Balance:** ${CREDITS_PER_PACK} rooms of virtual staging (two staged versions of each room).`,
      `- **Valid until:** ${until}.`,
      `- **Account:** ${ctx.customerEmail} — sign in with this address to use them.`,
      "",
      "### How to use them",
      "",
      "1. Sign in at orvionis.com with the address above.",
      "2. Open Virtual Staging and upload up to 10 room photos per order.",
      "3. Keep “Use my Pro credits” ticked and start. There is no checkout; the rooms come off your balance.",
      "",
      "The staged photos carry no ORVIONIS mark. Every room also comes with “Virtually staged” labeled copies and an optional page with the original photo for the MLS disclosure.",
    ].join("\n");
    return { outputs: [{ type: "MARKDOWN", title: "Your Pro credits", content: { markdown }, previewText: `${CREDITS_PER_PACK} rooms, valid until ${until}` }], qc: { passed: true, notes: [] }, needsHuman: false };
  },
};
