import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { SAMPLE_LISTING_CLIPS_RESULT } from "@/lib/tools/samples/listing-clips";
import { validateVideoLink } from "@/lib/security/files";
import { checkFairHousing, checkNoPlaceholders, combine } from "@/lib/tools/qa";

/**
 * LISTING CLIPS — concierge (MANUAL) tool for real-estate agents.
 * The customer pays first (Stripe Checkout), AI drafts the clip plan + captions immediately,
 * a human edits the 5 vertical clips and delivers within 48h. Every step is logged so the
 * same tool can be flipped to HYBRID/AUTO later without changing the product.
 */

const intakeSchema = z.object({
  agentName: z.string().trim().min(2).max(80),
  brokerage: z.string().trim().max(120).optional().default(""),
  listingAddress: z.string().trim().min(5).max(200),
  price: z.string().trim().min(2).max(40),
  beds: z.coerce.number().int().min(0).max(50),
  baths: z.coerce.number().min(0).max(50),
  sqft: z.coerce.number().int().min(0).max(100000).optional().default(0),
  features: z.string().trim().min(10).max(2000),
  videoLink: z
    .string()
    .trim()
    .transform((v, ctx) => {
      try {
        return validateVideoLink(v);
      } catch (err) {
        ctx.addIssue({ code: "custom", message: (err as Error).message });
        return z.NEVER;
      }
    }),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#111111"),
  logoFileId: z.string().trim().max(64).optional().default(""),
  socialHandle: z.string().trim().max(60).optional().default(""),
  style: z.enum(["cinematic", "fast", "clean"]).default("cinematic"),
  musicVibe: z.enum(["chill", "upbeat", "luxury", "none"]).default("chill"),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type ListingClipsIntake = z.infer<typeof intakeSchema>;

const clipPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["clips", "hashtags", "editorNotes"],
  properties: {
    clips: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "angle", "hook", "caption", "onScreenText", "durationSec", "shotPlan"],
        properties: {
          number: { type: "integer" },
          angle: { type: "string", description: "The single idea this clip sells (e.g. 'the kitchen', 'price + stats', 'the view')" },
          hook: { type: "string", description: "First 2 seconds spoken/text hook, max 12 words" },
          caption: { type: "string", description: "Post caption, 1-3 sentences, no hashtags" },
          onScreenText: { type: "array", items: { type: "string" }, description: "3-6 short overlays in order" },
          durationSec: { type: "integer", minimum: 12, maximum: 45 },
          shotPlan: { type: "array", items: { type: "string" }, description: "Ordered list of shots to pull from the walkthrough" },
        },
      },
    },
    hashtags: { type: "array", items: { type: "string" }, minItems: 8, maxItems: 15 },
    editorNotes: { type: "string", description: "Pacing, music, transitions, branding placement guidance for the editor" },
  },
};

const clipPlanSchema = z.object({
  clips: z
    .array(
      z.object({
        number: z.number().int(),
        angle: z.string(),
        hook: z.string(),
        caption: z.string(),
        onScreenText: z.array(z.string()),
        durationSec: z.number().int(),
        shotPlan: z.array(z.string()),
      }),
    )
    .min(5),
  hashtags: z.array(z.string()).min(5),
  editorNotes: z.string(),
});

export type ClipPlan = z.infer<typeof clipPlanSchema>;

const SYSTEM_PROMPT = `You are a senior short-form video editor and copywriter for US real-estate listings (Instagram Reels, TikTok, YouTube Shorts).
Write a production plan for exactly 5 vertical clips from ONE property walkthrough video.
Rules:
- Each clip sells ONE idea (e.g. curb appeal, kitchen, primary suite, outdoor space, price + facts). Never repeat an angle.
- Hooks are concrete and visual ("This kitchen has a 10-foot island" beats "Dream home alert").
- On-screen text: short, factual, uses the listing facts provided (price, beds, baths, sqft, features). No exclamation-mark spam, at most one emoji per caption.
- FAIR HOUSING (US): describe the PROPERTY, never the ideal buyer. Do not mention families, children, religion, nationality, age, disability, or "safe"/"exclusive" neighborhoods. No phrases like "perfect for families", "bachelor pad", "walking distance to church".
- Do not invent facts that are not in the intake. If a detail is unknown, leave it out.
- Output must match the JSON schema exactly.`;

export const listingClipsTool: ToolDefinition<ListingClipsIntake> = {
  id: "listing-clips",
  slug: "listing-clips",
  name: "Listing Clips",
  category: "real-estate",
  tagline: "Send one walkthrough video. Get 5 ready-to-post vertical clips with captions in 48 hours.",
  io: {
    input: "Walkthrough video link + listing facts",
    output: "5 vertical clips (MP4) with price, stats and captions",
    processingTime: "48 hours",
    ctaLabel: "Create clips",
  },
  featured: true,
  description:
    "Turn one listing walkthrough into five captioned 9:16 clips for Instagram Reels, TikTok and YouTube Shorts — with price and property stats on screen, your branding, and captions plus hashtags written for you. Edited by a human, planned by AI, delivered in 48 hours.",
  fulfillment: "MANUAL",
  initialStatus: "LIVE",
  version: 1,
  intake: {
    schema: intakeSchema,
    fields: [
      { key: "agentName", label: "Your name (as it should appear on the clips)", type: "text", required: true, placeholder: "Jordan Lee" },
      { key: "brokerage", label: "Brokerage / team (optional)", type: "text", placeholder: "Keller Williams Austin" },
      { key: "listingAddress", label: "Listing address or neighborhood", type: "text", required: true, placeholder: "1420 Oak Hill Dr, Austin, TX" },
      { key: "price", label: "List price", type: "text", required: true, placeholder: "$549,000" },
      { key: "beds", label: "Beds", type: "number", required: true, placeholder: "3" },
      { key: "baths", label: "Baths", type: "number", required: true, placeholder: "2.5" },
      { key: "sqft", label: "Square feet (optional)", type: "number", placeholder: "2,140" },
      {
        key: "features",
        label: "Top 5 features worth showing",
        type: "textarea",
        required: true,
        rows: 4,
        placeholder: "Renovated kitchen with quartz island; covered patio; primary suite with soaking tub; 2-car garage; 0.4-acre lot",
      },
      {
        key: "videoLink",
        label: "Walkthrough video link",
        type: "url",
        required: true,
        placeholder: "https://drive.google.com/... or unlisted YouTube link",
        help: "Google Drive, Dropbox, WeTransfer, unlisted YouTube or Vimeo. Phone footage is fine — vertical or horizontal.",
      },
      { key: "brandColor", label: "Brand color (optional)", type: "color" },
      { key: "logoFileId", label: "Logo (optional, PNG/JPG up to 2 MB)", type: "image" },
      { key: "socialHandle", label: "Instagram / TikTok handle (optional)", type: "text", placeholder: "@jordanleehomes" },
      {
        key: "style",
        label: "Editing style",
        type: "select",
        options: [
          { value: "cinematic", label: "Cinematic (slow, elegant)" },
          { value: "fast", label: "Fast-paced (quick cuts, energetic)" },
          { value: "clean", label: "Clean & minimal" },
        ],
      },
      {
        key: "musicVibe",
        label: "Music",
        type: "select",
        options: [
          { value: "chill", label: "Chill / lo-fi" },
          { value: "upbeat", label: "Upbeat" },
          { value: "luxury", label: "Luxury / cinematic" },
          { value: "none", label: "No music (I'll add trending audio myself)" },
        ],
      },
      { key: "notes", label: "Anything else? (optional)", type: "textarea", rows: 3, placeholder: "Open house Sunday 2–4pm — mention it in one clip" },
    ],
  },
  pricing: {
    sku: "LISTING_CLIPS_5",
    name: "Listing Clips — 5 vertical clips",
    priceCents: 4900,
    currency: "usd",
    compareAtText: "Editing agencies charge from $195/month for 10 clips; single Fiverr edits run $15–$65 per video",
  },
  sla: { deliveryHours: 48 },
  landing: {
    headline: "One walkthrough video. Five listing clips. Posted by Friday.",
    subheadline:
      "Send us the raw walkthrough of your listing. In 48 hours you get five 9:16 clips with price and stats on screen, your branding, captions and hashtags — ready to post on Instagram, TikTok and YouTube Shorts.",
    bullets: [
      "5 vertical clips (15–45 s each) cut from your own footage — phone video is fine",
      "Price, beds/baths, square footage and key features as on-screen text",
      "Your name, brokerage and logo on every clip",
      "Captions + hashtags written for each clip, fair-housing checked",
      "Delivered as MP4 files in 48 hours, one free revision round",
    ],
    howItWorks: [
      { title: "1. Fill in the listing facts", text: "Two minutes: address, price, stats, the five things worth showing, and a link to your walkthrough video." },
      { title: "2. Pay $49", text: "Secure checkout via Stripe. You get a confirmation and a private order page." },
      { title: "3. Get 5 clips in 48 hours", text: "A human editor cuts the clips using an AI-drafted plan. You get download links plus captions and hashtags." },
    ],
    faq: [
      { q: "What footage works?", a: "A continuous walkthrough shot on a phone (30 s to 15 min), vertical or horizontal. Drone footage is a bonus. Share via Google Drive, Dropbox, WeTransfer or an unlisted YouTube link." },
      { q: "Can I use the clips anywhere?", a: "Yes — Instagram Reels, TikTok, YouTube Shorts, Facebook, your MLS listing or email. Files are yours." },
      { q: "What about music?", a: "We add royalty-free music in the vibe you pick, or deliver silent clips so you can use trending audio inside Instagram/TikTok (recommended for reach)." },
      { q: "Do you write the captions?", a: "Yes. Each clip comes with a hook, caption and hashtags. We follow fair-housing wording rules — the copy describes the property, never the buyer." },
      { q: "What if I don't like a clip?", a: "One revision round is included. If we can't fix it, you get a refund for that order — see the refund policy." },
    ],
    ctaLabel: "Get my 5 clips — $49",
    guarantee: "Not happy with the clips after one revision? Full refund on your first order.",
    deliveryPromise: "Delivered within 48 hours (business days).",
    sample: SAMPLE_LISTING_CLIPS_RESULT,
  },
  seo: {
    title: "Listing Clips — 5 vertical listing clips from one walkthrough | ORVIONIS",
    description:
      "Turn one listing walkthrough into 5 captioned vertical clips for Reels, TikTok and Shorts. Price and stats on screen, your branding, delivered in 48 hours. $49 per listing.",
    keywords: ["real estate video editing", "listing reels", "real estate tiktok clips", "vertical listing video", "real estate short form video"],
  },
  delivery: {
    emailSubject: "Your 5 listing clips are ready",
    emailIntro: "Your clips are ready to download. Captions and hashtags for each clip are on your order page.",
  },
  conciergeChecklist: [
    "Download the walkthrough from the customer's link (never re-upload their raw footage anywhere public)",
    "Open the AI clip plan on this order: 5 angles, hooks, on-screen text, shot list",
    "Cut 5 clips (9:16, 1080×1920, 15–45 s) in CapCut/DaVinci following the plan; add price/stats overlays and branding",
    "Music per intake vibe (royalty-free) or silent if 'none'",
    "Export MP4 (H.264, ≤ 60 MB each), upload to a share folder, paste the link in 'Delivery link' below",
    "Re-read captions for fair-housing wording; edit if needed; then click 'Deliver'",
  ],
  async run(ctx) {
    const i = ctx.intake;
    ctx.step("ai_plan", "Drafting 5-clip plan, hooks and captions");
    const facts = [
      `Agent: ${i.agentName}${i.brokerage ? ` (${i.brokerage})` : ""}${i.socialHandle ? `, ${i.socialHandle}` : ""}`,
      `Listing: ${i.listingAddress}`,
      `Price: ${i.price}`,
      `Beds: ${i.beds} · Baths: ${i.baths}${i.sqft ? ` · Sqft: ${i.sqft}` : ""}`,
      `Features: ${i.features}`,
      `Editing style: ${i.style} · Music: ${i.musicVibe}`,
      i.notes ? `Extra notes from the agent: ${i.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: plan, costMicros } = await ctx.ai.completeStructured<ClipPlan>(
      {
        tier: "standard",
        system: SYSTEM_PROMPT,
        user: `Listing intake:\n${facts}\n\nProduce the 5-clip plan now.`,
        schemaName: "clip_plan",
        jsonSchema: clipPlanJsonSchema,
        parse: (raw) => clipPlanSchema.parse(raw),
        maxOutputTokens: 3000,
      },
      "generate",
    );

    ctx.step("qa", `Deterministic QA (fair housing, placeholders); AI cost ${costMicros} µ$`);
    const allText = JSON.stringify(plan);
    const qc = combine(checkNoPlaceholders(allText), checkFairHousing(allText));

    const markdown = [
      `# Clip plan — ${i.listingAddress}`,
      "",
      ...plan.clips.flatMap((c) => [
        `## Clip ${c.number}: ${c.angle} (${c.durationSec}s)`,
        `**Hook:** ${c.hook}`,
        "",
        `**Caption:** ${c.caption}`,
        "",
        `**On-screen text:** ${c.onScreenText.join(" → ")}`,
        "",
        `**Shots:** ${c.shotPlan.join("; ")}`,
        "",
      ]),
      `**Hashtags:** ${plan.hashtags.join(" ")}`,
      "",
      `**Editor notes:** ${plan.editorNotes}`,
    ].join("\n");

    return {
      needsHuman: true,
      qc,
      outputs: [
        { type: "JSON", title: "Clip plan (structured)", content: plan },
        { type: "MARKDOWN", title: "Captions & hashtags", content: { markdown }, previewText: plan.clips[0]?.hook },
      ],
    };
  },
};
