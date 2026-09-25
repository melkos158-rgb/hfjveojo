import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { checkContains, checkLength, checkNoPlaceholders, combine } from "@/lib/tools/qa";
import { renderPricingGuidePdf, type PricingGuideDoc } from "@/lib/render/pricingGuidePdf";

/**
 * PHOTOGRAPHER PRICING GUIDE — fully automated (AUTO) document tool.
 * Intake → AI writes the guide copy from the photographer's real packages → deterministic + AI QA → branded PDF.
 * This is the first tool that exercises the whole automated pipeline end to end.
 */

const intakeSchema = z.object({
  studioName: z.string().trim().min(2).max(80),
  photographerName: z.string().trim().min(2).max(80),
  genre: z.enum(["wedding", "portrait", "family", "newborn", "senior", "boudoir", "brand", "other"]).default("wedding"),
  location: z.string().trim().min(2).max(120),
  packagesText: z.string().trim().min(10).max(4000),
  addOnsText: z.string().trim().max(2000).optional().default(""),
  turnaround: z.string().trim().max(120).optional().default(""),
  depositPolicy: z.string().trim().max(200).optional().default(""),
  brandVoice: z.enum(["warm", "luxury", "playful", "documentary"]).default("warm"),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#8a6d3b"),
  website: z.string().trim().max(200).optional().default(""),
  instagram: z.string().trim().max(80).optional().default(""),
  aboutNotes: z.string().trim().max(2000).optional().default(""),
});

export type PricingGuideIntake = z.infer<typeof intakeSchema>;

export type ParsedPackage = { name: string; price: string; includes: string };

/** "Name | $Price | what's included" or "Name — $Price — ..." — one per line. */
export function parsePackages(text: string): ParsedPackage[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[|—–]\s*|\s+-\s+/).map((p) => p.trim());
      const name = parts[0] ?? line;
      const price = parts[1] ?? "";
      const includes = parts.slice(2).join(" — ");
      return { name, price, includes };
    })
    .filter((p) => p.name.length > 0);
}

const guideJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["coverTitle", "tagline", "about", "philosophy", "packages", "addOns", "process", "faq", "policies", "cta"],
  properties: {
    coverTitle: { type: "string", description: "e.g. 'Wedding Collections 2026' or 'Pricing Guide'" },
    tagline: { type: "string", description: "One line, brand voice" },
    about: { type: "string", description: "2 short paragraphs in first person, 80-140 words" },
    philosophy: { type: "string", description: "How the photographer works, 60-100 words" },
    packages: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "price", "description", "includes"],
        properties: {
          name: { type: "string" },
          price: { type: "string", description: "EXACTLY as given in the intake" },
          description: { type: "string", description: "1-2 sentences, who it is for" },
          includes: { type: "array", items: { type: "string" }, minItems: 2 },
        },
      },
    },
    addOns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "price", "description"],
        properties: { name: { type: "string" }, price: { type: "string" }, description: { type: "string" } },
      },
    },
    process: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "text"],
        properties: { title: { type: "string" }, text: { type: "string" } },
      },
    },
    faq: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["q", "a"],
        properties: { q: { type: "string" }, a: { type: "string" } },
      },
    },
    policies: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    cta: { type: "string", description: "One friendly closing line inviting to book" },
  },
};

const guideSchema = z.object({
  coverTitle: z.string(),
  tagline: z.string(),
  about: z.string(),
  philosophy: z.string(),
  packages: z.array(z.object({ name: z.string(), price: z.string(), description: z.string(), includes: z.array(z.string()) })).min(1),
  addOns: z.array(z.object({ name: z.string(), price: z.string(), description: z.string() })),
  process: z.array(z.object({ title: z.string(), text: z.string() })).min(3),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(4),
  policies: z.array(z.string()).min(3),
  cta: z.string(),
});

type Guide = z.infer<typeof guideSchema>;

const qaJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "issues"],
  properties: {
    ok: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
  },
};

const VOICE: Record<PricingGuideIntake["brandVoice"], string> = {
  warm: "warm, personal, reassuring; plain words; no hype",
  luxury: "refined, calm, editorial; short sentences; no exclamation marks",
  playful: "light, upbeat, a little witty; still professional",
  documentary: "honest, unposed, storytelling; focuses on real moments",
};

const SYSTEM_PROMPT = `You write client-facing pricing guides for independent photographers.
Rules:
- Use ONLY the packages, prices, add-ons and policies given in the intake. Copy every price EXACTLY as written. Never invent prices, discounts, awards, years of experience, client counts or testimonials.
- Write in first person as the photographer. Match the requested brand voice.
- No placeholders, no brackets, no "[insert...]". If something is unknown, write around it.
- Keep it concise and skimmable: a client should understand what they get and what it costs in under two minutes.
- Output must match the JSON schema exactly.`;

export const photoPricingGuideTool: ToolDefinition<PricingGuideIntake> = {
  id: "photo-pricing-guide",
  slug: "photographer-pricing-guide",
  name: "Photographer Pricing Guide",
  category: "photography",
  tagline: "Your packages, written up and designed into a branded PDF pricing guide in minutes.",
  description:
    "Answer ten questions about your packages and style. Get a polished, branded PDF pricing guide — cover, about page, packages with prices, add-ons, process, FAQ and policies — written in your voice and ready to send to enquiries.",
  fulfillment: "AUTO",
  initialStatus: "LIVE",
  version: 1,
  intake: {
    schema: intakeSchema,
    fields: [
      { key: "studioName", label: "Studio / business name", type: "text", required: true, placeholder: "Ember & Oak Photography" },
      { key: "photographerName", label: "Your name", type: "text", required: true, placeholder: "Maya Torres" },
      {
        key: "genre",
        label: "Main genre",
        type: "select",
        options: [
          { value: "wedding", label: "Wedding" },
          { value: "portrait", label: "Portrait" },
          { value: "family", label: "Family" },
          { value: "newborn", label: "Newborn / maternity" },
          { value: "senior", label: "Senior" },
          { value: "boudoir", label: "Boudoir" },
          { value: "brand", label: "Brand / headshots" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "location", label: "Where you're based", type: "text", required: true, placeholder: "Denver, Colorado" },
      {
        key: "packagesText",
        label: "Your packages — one per line: Name | Price | What's included",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "The Essentials | $2,400 | 6 hours coverage, 400+ edited photos, online gallery\nThe Full Day | $3,800 | 10 hours, second shooter, 700+ photos, engagement session",
      },
      { key: "addOnsText", label: "Add-ons (optional) — one per line: Name | Price | Note", type: "textarea", rows: 3, placeholder: "Extra hour | $350 | Booked in advance\nFine-art album | $900 | 30 pages" },
      { key: "turnaround", label: "Delivery turnaround (optional)", type: "text", placeholder: "Sneak peeks in 48 hours, full gallery in 6 weeks" },
      { key: "depositPolicy", label: "Booking / deposit policy (optional)", type: "text", placeholder: "30% non-refundable retainer, balance due 2 weeks before" },
      {
        key: "brandVoice",
        label: "Brand voice",
        type: "select",
        options: [
          { value: "warm", label: "Warm & personal" },
          { value: "luxury", label: "Luxury & editorial" },
          { value: "playful", label: "Playful" },
          { value: "documentary", label: "Documentary" },
        ],
      },
      { key: "brandColor", label: "Brand color", type: "color" },
      { key: "website", label: "Website (optional)", type: "text", placeholder: "emberandoak.com" },
      { key: "instagram", label: "Instagram (optional)", type: "text", placeholder: "@emberandoak" },
      { key: "aboutNotes", label: "A few facts about you and your style (optional)", type: "textarea", rows: 3, placeholder: "Shooting weddings since 2018, film-inspired colors, I love candid moments over posed shots" },
    ],
  },
  pricing: {
    sku: "PHOTO_PRICING_GUIDE",
    name: "Photographer Pricing Guide (PDF)",
    priceCents: 2900,
    currency: "usd",
    compareAtText: "Canva pricing-guide templates cost $10–$20 and still need hours of writing and layout",
  },
  sla: { deliveryHours: 1 },
  landing: {
    headline: "A pricing guide that sells your packages — written and designed in minutes.",
    subheadline:
      "Stop rebuilding Canva templates. Tell us your packages, prices and style; get a branded PDF pricing guide in your voice that you can send to every enquiry today.",
    bullets: [
      "Cover, about page, packages with prices, add-ons, process, FAQ and policies — 5 pages",
      "Written from YOUR real packages; prices copied exactly, nothing invented",
      "Your brand color, name and links on every page",
      "PDF ready in minutes; regenerate free once if you tweak your answers",
      "Fair price: $29 one-time — no subscription",
    ],
    howItWorks: [
      { title: "1. Answer 10 questions", text: "Packages, prices, add-ons, turnaround, policies, brand voice. Five minutes if you know your prices." },
      { title: "2. Pay $29", text: "Secure checkout via Stripe. Your guide starts generating immediately." },
      { title: "3. Download your PDF", text: "Usually ready in under 5 minutes. Get it on your order page and by email." },
    ],
    faq: [
      { q: "Will it sound like me?", a: "You pick the brand voice and add a few facts about your style; the copy is written in first person from those. You can regenerate once for free after editing your answers." },
      { q: "Can I edit it afterwards?", a: "You receive the PDF plus the full text in Markdown so you can paste it into Canva, Notion or your website." },
      { q: "What about my logo?", a: "V1 uses your studio name and brand color in a clean typographic layout. Logo placement is coming next." },
      { q: "Is it legal advice?", a: "No. The policies section restates the policies you provide. Contracts are not included." },
    ],
    ctaLabel: "Create my pricing guide — $29",
    guarantee: "If the guide is unusable, tell us within 7 days and we refund you.",
    deliveryPromise: "Usually ready in under 5 minutes.",
  },
  seo: {
    title: "Photographer Pricing Guide Generator — branded PDF in minutes | ORVIONIS",
    description:
      "Create a branded photography pricing guide PDF from your real packages and prices. Cover, about, packages, add-ons, FAQ and policies written in your voice. $29, no subscription.",
    keywords: ["photography pricing guide", "wedding photographer pricing guide template", "photographer price list pdf", "photography packages pdf"],
  },
  delivery: {
    emailSubject: "Your pricing guide is ready",
    emailIntro: "Your branded pricing guide PDF is ready to download. The full text is also on your order page for copy-paste.",
  },
  async run(ctx) {
    const i = ctx.intake;
    const packages = parsePackages(i.packagesText);
    const addOns = i.addOnsText ? parsePackages(i.addOnsText) : [];
    if (packages.length === 0) throw new Error("No packages could be parsed from the intake");

    ctx.step("ai_generate", "Writing guide copy from intake");
    const intakeText = [
      `Studio: ${i.studioName}`,
      `Photographer: ${i.photographerName}`,
      `Genre: ${i.genre}`,
      `Location: ${i.location}`,
      `Brand voice: ${VOICE[i.brandVoice]}`,
      `Packages:\n${packages.map((p) => `- ${p.name} | ${p.price} | ${p.includes}`).join("\n")}`,
      addOns.length ? `Add-ons:\n${addOns.map((p) => `- ${p.name} | ${p.price} | ${p.includes}`).join("\n")}` : "Add-ons: none",
      i.turnaround ? `Turnaround: ${i.turnaround}` : "",
      i.depositPolicy ? `Booking/deposit policy: ${i.depositPolicy}` : "",
      i.aboutNotes ? `About the photographer (facts to use): ${i.aboutNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const gen = await ctx.ai.completeStructured<Guide>(
      {
        tier: "standard",
        system: SYSTEM_PROMPT,
        user: `Intake:\n${intakeText}\n\nWrite the pricing guide now.`,
        schemaName: "pricing_guide",
        jsonSchema: guideJsonSchema,
        parse: (raw) => guideSchema.parse(raw),
        maxOutputTokens: 3500,
      },
      "generate",
    );
    const guide = gen.data;

    ctx.step("qa_rules", "Deterministic QA: prices present, no placeholders, length");
    const text = JSON.stringify(guide);
    const priceNeedles = packages.map((p) => p.price).filter((p) => p.length > 0);
    const rules = combine(checkNoPlaceholders(text), checkContains(text, priceNeedles, "Package price"), checkLength(guide.about, 200, "About"));

    ctx.step("qa_model", "Model QA (cheap tier)");
    let modelNotes: string[] = [];
    try {
      const qa = await ctx.ai.completeStructured<{ ok: boolean; issues: string[] }>(
        {
          tier: "cheap",
          system:
            "You are a strict proofreader for a photographer's pricing guide. Check: prices match the intake exactly; no invented facts (awards, years, client counts); no placeholders; no contradictions between packages; tone is consistent. Return ok=true only if there are no real problems. List concrete issues otherwise.",
          user: `Intake:\n${intakeText}\n\nGuide JSON:\n${text}`,
          schemaName: "qa_result",
          jsonSchema: qaJsonSchema,
          parse: (raw) => z.object({ ok: z.boolean(), issues: z.array(z.string()) }).parse(raw),
          maxOutputTokens: 600,
        },
        "qa",
      );
      modelNotes = qa.data.ok ? [] : qa.data.issues.map((s) => `Model QA: ${s}`);
    } catch (err) {
      modelNotes = [`Model QA unavailable: ${(err as Error).message.slice(0, 120)}`];
    }

    ctx.step("render_pdf", "Rendering branded PDF");
    const doc: PricingGuideDoc = {
      brand: {
        studioName: i.studioName,
        photographerName: i.photographerName,
        color: i.brandColor,
        website: i.website || undefined,
        instagram: i.instagram || undefined,
        location: i.location,
      },
      ...guide,
    };
    const pdf = await renderPricingGuidePdf(doc);

    const markdown = [
      `# ${guide.coverTitle}`,
      `_${guide.tagline}_`,
      "",
      `## About`,
      guide.about,
      "",
      guide.philosophy,
      "",
      `## Packages`,
      ...guide.packages.flatMap((p) => [`### ${p.name} — ${p.price}`, p.description, ...p.includes.map((x) => `- ${x}`), ""]),
      ...(guide.addOns.length ? ["## Add-ons", ...guide.addOns.map((a) => `- **${a.name}** — ${a.price}. ${a.description}`), ""] : []),
      `## What happens next`,
      ...guide.process.map((p, idx) => `${idx + 1}. **${p.title}** — ${p.text}`),
      "",
      `## FAQ`,
      ...guide.faq.flatMap((f) => [`**${f.q}**`, f.a, ""]),
      `## Policies`,
      ...guide.policies.map((p) => `- ${p}`),
      "",
      guide.cta,
    ].join("\n");

    const qc = combine(rules.notes, modelNotes);
    const safeName = i.studioName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "studio";

    return {
      needsHuman: false,
      qc,
      outputs: [
        {
          type: "PDF",
          title: `${i.studioName} — ${guide.coverTitle}`,
          file: { name: `${safeName}-pricing-guide.pdf`, mime: "application/pdf", data: pdf },
          previewText: guide.tagline,
        },
        { type: "MARKDOWN", title: "Full text (Markdown)", content: { markdown } },
        { type: "JSON", title: "Structured guide", content: guide },
      ],
    };
  },
};
