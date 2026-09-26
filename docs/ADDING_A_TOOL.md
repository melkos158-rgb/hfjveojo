# Adding a tool in under an hour

A tool is one file. The platform provides landing, intake, checkout, fulfilment, QC, delivery, admin and analytics.

## 1. Define it

`src/lib/tools/definitions/handyman-quote-pack.ts` (example):

```ts
import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { checkNoPlaceholders, combine } from "@/lib/tools/qa";

const intakeSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  trade: z.enum(["handyman", "plumber", "electrician"]).default("handyman"),
  jobDescription: z.string().trim().min(20).max(3000),
  hourlyRate: z.coerce.number().positive(),
});
type Intake = z.infer<typeof intakeSchema>;

export const handymanQuotePackTool: ToolDefinition<Intake> = {
  id: "handyman-quote-pack",
  slug: "handyman-quote-pack",
  name: "Handyman Quote Pack",
  category: "handymen",
  tagline: "Describe the job, get a professional quote PDF and follow-up email in minutes.",
  description: "…",
  fulfillment: "AUTO",            // AUTO | MANUAL | HYBRID
  initialStatus: "VALIDATING",    // DRAFT | VALIDATING | LIVE | PAUSED | DEPRECATED
  version: 1,
  intake: {
    schema: intakeSchema,
    fields: [
      { key: "businessName", label: "Business name", type: "text", required: true },
      { key: "trade", label: "Trade", type: "select", options: [{ value: "handyman", label: "Handyman" }, { value: "plumber", label: "Plumber" }, { value: "electrician", label: "Electrician" }] },
      { key: "jobDescription", label: "Describe the job", type: "textarea", rows: 5, required: true },
      { key: "hourlyRate", label: "Your hourly rate ($)", type: "number", required: true },
    ],
  },
  pricing: { sku: "HANDYMAN_QUOTE_PACK", name: "Handyman Quote Pack", priceCents: 1900, currency: "usd" },
  sla: { deliveryHours: 1 },
  landing: { headline: "…", subheadline: "…", bullets: ["…"], howItWorks: [{ title: "…", text: "…" }], faq: [{ q: "…", a: "…" }], ctaLabel: "Get my quote pack — $19", deliveryPromise: "Ready in minutes." },
  seo: { title: "…", description: "…", keywords: ["…"] },
  delivery: { emailSubject: "Your quote pack is ready", emailIntro: "…" },
  async run(ctx) {
    ctx.step("generate");
    const { data } = await ctx.ai.completeStructured<{ quote: string; email: string }>(
      { tier: "standard", system: "…", user: JSON.stringify(ctx.intake), schemaName: "quote_pack", jsonSchema: { type: "object", required: ["quote", "email"], properties: { quote: { type: "string" }, email: { type: "string" } } }, parse: (raw) => raw as { quote: string; email: string } },
      "generate",
    );
    const qc = combine(checkNoPlaceholders(data.quote + data.email));
    return { needsHuman: false, qc, outputs: [{ type: "MARKDOWN", title: "Quote & email", content: { markdown: `${data.quote}\n\n---\n\n${data.email}` } }] };
  },
};
```

## 2. Register and seed

Add it to `definitions` in `src/lib/tools/registry.ts`, run `npm run db:seed`. The Tool, ToolVersion and Product rows are upserted; existing statuses and admin-locked prices are preserved.

## 3. Ship

Set status in `/admin/tools`. The tool appears on `/tools`, its category landing (add a `VerticalLanding` page for a new category — 20 lines, see `src/app/real-estate/page.tsx`), the sitemap, and pricing. Create an experiment for it in `/admin/experiments` before sending traffic.

## Concierge tools

Return `needsHuman: true` from `run()`; the order stops in REVIEW with the AI-drafted outputs attached, the admin gets an email, and the concierge checklist (`conciergeChecklist`) shows on the order page. When the manual step is later automated, change `fulfillment` to `HYBRID`/`AUTO` and return `needsHuman: false` — nothing else changes.

## Renderers

PDF: `src/lib/render/pricingGuidePdf.ts` is a template — copy it for a new document type (createElement style so it runs in the worker too). Files go through `putFile()`; outputs with `file` get a signed download link automatically.

## Optional extras (see Virtual Staging)

- `preview` — a free, watermarked preview on the order form: implement `run({ intake, ai })` returning one image; `src/lib/tools/preview.ts` validates the intake, applies the daily / per-IP / budget caps, watermarks and downsizes. Nothing is stored.
- `disclosurePack: true` — for tools that digitally alter listing photos: the order gets a public token at checkout, the order page shows the disclosure pack (public page with the original photo at `/original/<token>`, a QR code, the line to paste, and any `IMAGE` outputs marked `content.variant = "labeled"`), see `src/lib/tools/disclosure.ts`.
- Image outputs are listed in generation order on the order page (`version 1` = the file named `-v1`); labelled copies stay out of the before/after grid.
