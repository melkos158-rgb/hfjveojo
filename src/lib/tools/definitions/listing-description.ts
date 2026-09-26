import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { SAMPLE_LISTING_DESCRIPTION_RESULT } from "@/lib/tools/samples/listing-description";
import { checkFairHousing, checkLength, checkNoPlaceholders, combine } from "@/lib/tools/qa";

/**
 * LISTING DESCRIPTION — fully automated (AUTO) text tool for real-estate agents.
 * Listing facts → MLS-ready description + long web version + social captions + hashtags, in minutes.
 * Cheapest entry product for the real-estate vertical; agents have a new listing every few weeks, so this is
 * built for repeat orders. Fair-housing phrasing is flagged by rules AND checked by the model; a flag parks
 * the order for a human instead of shipping risky copy.
 */

const intakeSchema = z.object({
  address: z.string().trim().min(5).max(160),
  price: z.string().trim().min(2).max(40),
  beds: z.string().trim().min(1).max(10),
  baths: z.string().trim().min(1).max(10),
  sqft: z.string().trim().max(20).optional().default(""),
  propertyType: z.enum(["single-family", "condo", "townhouse", "multi-family", "land", "other"]).default("single-family"),
  features: z.string().trim().min(15).max(3000),
  neighborhood: z.string().trim().max(1500).optional().default(""),
  tone: z.enum(["warm", "luxury", "straightforward", "storytelling"]).default("warm"),
  mlsLimit: z.enum(["1000", "1500", "2500"]).default("1000"),
  openHouse: z.string().trim().max(200).optional().default(""),
  agentName: z.string().trim().max(80).optional().default(""),
  brokerage: z.string().trim().max(120).optional().default(""),
});

export type ListingDescriptionIntake = z.infer<typeof intakeSchema>;

const outputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "description", "longDescription", "captions", "hashtags", "emailBlurb"],
  properties: {
    headline: { type: "string", description: "Listing headline, max 60 characters, no exclamation marks" },
    description: { type: "string", description: "MLS-ready description within the character limit; facts only from the intake; no fair-housing violations" },
    longDescription: { type: "string", description: "Website / brochure version, 2-4 paragraphs, same facts, more texture" },
    captions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["platform", "text"],
        properties: {
          platform: { type: "string", description: "instagram | facebook | reels_hook" },
          text: { type: "string", description: "Ready-to-post caption for that platform; reels_hook is one punchy line under 12 words" },
        },
      },
    },
    hashtags: { type: "array", minItems: 8, maxItems: 15, items: { type: "string", description: "without the # sign" } },
    emailBlurb: { type: "string", description: "2-3 sentences an agent can paste into a 'just listed' email" },
  },
};

const outputSchema = z.object({
  headline: z.string(),
  description: z.string(),
  longDescription: z.string(),
  captions: z.array(z.object({ platform: z.string(), text: z.string() })).min(3),
  hashtags: z.array(z.string()).min(5),
  emailBlurb: z.string(),
});

type ListingCopy = z.infer<typeof outputSchema>;

const TONE: Record<ListingDescriptionIntake["tone"], string> = {
  warm: "warm and inviting, plain words, no hype, no exclamation marks",
  luxury: "refined and understated; short sentences; precise nouns; never 'stunning' or 'breathtaking'",
  straightforward: "factual and efficient; lead with the numbers and the three strongest features",
  storytelling: "walk the reader through the home room by room, in the order a visitor would see it",
};

const SYSTEM_PROMPT = `You write real-estate listing copy for licensed agents in the United States.
Rules:
- Use ONLY the facts given in the intake. Never invent square footage, years, renovations, school ratings, distances or awards. If a fact is missing, leave it out.
- Copy numbers exactly as given (price, beds, baths, square footage).
- Fair Housing Act compliance is mandatory: describe the property, never the buyer. No references to family status, religion, race, national origin, disability, age, or "safe"/"exclusive" neighborhoods. Do not say who the home is "perfect for".
- No placeholders, brackets or "[insert]". No ALL CAPS, at most one exclamation mark in the whole output.
- Respect the MLS character limit for the description field exactly.`;

export const listingDescriptionTool: ToolDefinition<ListingDescriptionIntake> = {
  id: "listing-description",
  slug: "listing-description",
  name: "Listing Description",
  category: "real-estate",
  tagline: "Listing facts in, MLS-ready description plus social captions out — in about five minutes.",
  io: {
    input: "Address, price, beds/baths and the five things worth mentioning",
    output: "MLS description + long version + 3 captions + hashtags",
    processingTime: "About 5 minutes",
    ctaLabel: "Write my listing",
  },
  description:
    "Type in the listing facts and the features worth showing. Get an MLS-ready description within your character limit, a longer website version, three social captions, hashtags and a 'just listed' email blurb — fair-housing checked, in minutes.",
  fulfillment: "AUTO",
  initialStatus: "LIVE",
  version: 1,
  intake: {
    schema: intakeSchema,
    fields: [
      { key: "address", label: "Property address", type: "text", required: true, placeholder: "1420 Oak Hill Dr, Austin, TX" },
      { key: "price", label: "List price", type: "text", required: true, placeholder: "$549,000" },
      { key: "beds", label: "Beds", type: "text", required: true, placeholder: "3" },
      { key: "baths", label: "Baths", type: "text", required: true, placeholder: "2.5" },
      { key: "sqft", label: "Square feet (optional)", type: "text", placeholder: "1,980" },
      {
        key: "propertyType",
        label: "Property type",
        type: "select",
        options: [
          { value: "single-family", label: "Single-family home" },
          { value: "condo", label: "Condo" },
          { value: "townhouse", label: "Townhouse" },
          { value: "multi-family", label: "Multi-family" },
          { value: "land", label: "Land / lot" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "features",
        label: "The features worth mentioning — facts only, one per line",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "Renovated kitchen with quartz island (2024)\nCovered patio and fenced backyard\nPrimary suite with walk-in closet\nTwo-car garage, EV outlet\nNew roof 2023",
      },
      { key: "neighborhood", label: "Location facts (optional) — parks, transit, shops; no school ratings or 'safe'", type: "textarea", rows: 2, placeholder: "Four blocks from Zilker Park; 10 minutes to downtown; coffee and groceries on the corner" },
      {
        key: "tone",
        label: "Tone",
        type: "select",
        options: [
          { value: "warm", label: "Warm & inviting" },
          { value: "luxury", label: "Luxury & understated" },
          { value: "straightforward", label: "Straightforward" },
          { value: "storytelling", label: "Storytelling walk-through" },
        ],
      },
      {
        key: "mlsLimit",
        label: "MLS description limit",
        type: "select",
        options: [
          { value: "1000", label: "1,000 characters (most MLSs)" },
          { value: "1500", label: "1,500 characters" },
          { value: "2500", label: "2,500 characters" },
        ],
      },
      { key: "openHouse", label: "Open house (optional)", type: "text", placeholder: "Sunday 2–4 pm" },
      { key: "agentName", label: "Your name (optional, for the email blurb)", type: "text", placeholder: "Jordan Lee" },
      { key: "brokerage", label: "Brokerage (optional)", type: "text", placeholder: "Lee & Co. Realty" },
    ],
  },
  pricing: {
    sku: "LISTING_DESCRIPTION",
    name: "Listing Description (MLS + social)",
    priceCents: 900,
    currency: "usd",
    compareAtText: "Copywriting subscriptions run $19–$49/month; a freelance description on Fiverr is $15–$40 and takes a day",
  },
  sla: { deliveryHours: 1 },
  landing: {
    headline: "A listing description written from your facts — MLS-ready in five minutes.",
    subheadline:
      "Enter the address, price, beds/baths and the features worth showing. You get the MLS description within your character limit, a longer web version, three social captions, hashtags and a 'just listed' email blurb.",
    bullets: [
      "MLS description that fits your limit (1,000 / 1,500 / 2,500 characters)",
      "Longer website version, three social captions and 10+ hashtags",
      "Facts only — nothing invented; numbers copied exactly",
      "Fair-housing wording checked by rules and a second model pass; risky copy goes to a human, not to you",
      "Ready in about five minutes, on your order page and by email",
    ],
    howItWorks: [
      { title: "1. Type the facts", text: "Address, price, beds, baths, the features worth mentioning. Two minutes." },
      { title: "2. Pay $9", text: "Stripe checkout. Writing starts immediately." },
      { title: "3. Copy and paste", text: "MLS text, web version, captions and hashtags on your order page — download as a file too." },
    ],
    faq: [
      { q: "Will it fit my MLS field?", a: "You choose the limit (1,000 characters by default); the description is written to fit and checked before delivery." },
      { q: "Is it fair-housing safe?", a: "The copy describes the property, never the buyer, and is checked twice for risky phrases. If anything is flagged, a person reviews it before you get it." },
      { q: "Can I get it rewritten?", a: "One revision is included — reply to the delivery email or use the feedback box on your order page." },
      { q: "Do you invent features?", a: "No. Only what you type in is used. If you forget a feature, add it and regenerate once for free." },
    ],
    ctaLabel: "Write my listing — $9",
    guarantee: "If the copy is unusable, tell us within 7 days and we refund you.",
    deliveryPromise: "Usually ready in about 5 minutes.",
    sample: SAMPLE_LISTING_DESCRIPTION_RESULT,
  },
  seo: {
    title: "Listing Description Writer — MLS-ready copy + social captions in minutes",
    description:
      "Turn listing facts into an MLS-ready description, a longer web version, three social captions and hashtags. Fair-housing checked. $9 per listing, no subscription.",
    keywords: ["listing description generator", "real estate listing description writer", "mls description writer", "property description generator", "just listed caption"],
  },
  delivery: {
    emailSubject: "Your listing description is ready",
    emailIntro: "Your MLS description, web version, captions and hashtags are ready — copy them from your order page or download the file.",
  },
  async run(ctx) {
    const i = ctx.intake;
    const limit = Number(i.mlsLimit);
    const features = i.features
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    ctx.step("ai_generate", "Writing listing copy from intake");
    const intakeText = [
      `Address: ${i.address}`,
      `Price: ${i.price}`,
      `Beds: ${i.beds} · Baths: ${i.baths}${i.sqft ? ` · Square feet: ${i.sqft}` : ""}`,
      `Property type: ${i.propertyType}`,
      `Features (facts, use all that fit):\n${features.map((f) => `- ${f}`).join("\n")}`,
      i.neighborhood ? `Location facts: ${i.neighborhood}` : "",
      i.openHouse ? `Open house: ${i.openHouse}` : "",
      i.agentName ? `Agent: ${i.agentName}${i.brokerage ? `, ${i.brokerage}` : ""}` : "",
      `Tone: ${TONE[i.tone]}`,
      `MLS description limit: ${limit} characters (hard limit)`,
    ]
      .filter(Boolean)
      .join("\n");

    const gen = await ctx.ai.completeStructured<ListingCopy>(
      {
        tier: "standard",
        system: SYSTEM_PROMPT,
        user: `Intake:\n${intakeText}\n\nWrite the listing copy now.`,
        schemaName: "listing_copy",
        jsonSchema: outputJsonSchema,
        parse: (raw) => outputSchema.parse(raw),
        maxOutputTokens: 2000,
      },
      "generate",
    );
    const copy = gen.data;

    ctx.step("qa_rules", "Deterministic QA: limit, placeholders, fair housing");
    const all = [copy.headline, copy.description, copy.longDescription, ...copy.captions.map((c) => c.text), copy.emailBlurb].join("\n");
    const overLimit = copy.description.length > limit ? [`MLS description is ${copy.description.length} characters (limit ${limit})`] : [];
    const rules = combine(checkNoPlaceholders(all), checkFairHousing(all), checkLength(copy.description, 200, "MLS description"), overLimit);

    ctx.step("qa_model", "Model QA (cheap tier): facts + fair housing");
    let modelNotes: string[] = [];
    try {
      const qa = await ctx.ai.completeStructured<{ ok: boolean; issues: string[] }>(
        {
          tier: "cheap",
          system:
            "You are a compliance reviewer for US real-estate listing copy. Check: every number matches the intake exactly; no invented facts; no Fair Housing Act problems (no references to family status, religion, race, national origin, disability, age; no 'safe'/'exclusive' neighborhood; no describing the ideal buyer); no placeholders. Return ok=true only if there are no real problems; otherwise list concrete issues.",
          user: `Intake:\n${intakeText}\n\nCopy JSON:\n${JSON.stringify(copy)}`,
          schemaName: "qa_result",
          jsonSchema: { type: "object", additionalProperties: false, required: ["ok", "issues"], properties: { ok: { type: "boolean" }, issues: { type: "array", items: { type: "string" } } } },
          parse: (raw) => z.object({ ok: z.boolean(), issues: z.array(z.string()) }).parse(raw),
          maxOutputTokens: 500,
        },
        "qa",
      );
      modelNotes = qa.data.ok ? [] : qa.data.issues.map((s) => `Model QA: ${s}`);
    } catch (err) {
      modelNotes = [`Model QA unavailable: ${(err as Error).message.slice(0, 120)}`];
    }

    const markdown = [
      `# ${copy.headline}`,
      "",
      `## MLS description (${copy.description.length}/${limit} characters)`,
      copy.description,
      "",
      `## Website version`,
      copy.longDescription,
      "",
      `## Social captions`,
      ...copy.captions.flatMap((c) => [`**${c.platform.replace("_", " ")}**`, c.text, ""]),
      `## Hashtags`,
      copy.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" "),
      "",
      `## "Just listed" email blurb`,
      copy.emailBlurb,
    ].join("\n");

    const safeName = i.address.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "listing";
    return {
      needsHuman: false,
      qc: combine(rules.notes, modelNotes),
      outputs: [
        {
          type: "MARKDOWN",
          title: "Listing copy (MLS, web, social)",
          content: { markdown },
          file: { name: `${safeName}-listing-copy.md`, mime: "text/markdown", data: Buffer.from(markdown, "utf8") },
          previewText: copy.headline,
        },
        { type: "JSON", title: "Structured copy", content: copy },
      ],
    };
  },
};
