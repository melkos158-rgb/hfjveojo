import type { z } from "zod";
import type { Fulfillment, ToolStatus, OutputType } from "@prisma/client";
import type { AiCall, AiCallContext } from "@/lib/ai";

/**
 * A Tool is configuration, not custom code paths in the app. Adding a tool = adding one definition file
 * and registering it. Landing page, intake form, checkout, fulfillment, delivery and analytics come for free.
 */

export type IntakeFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "select"
  | "color"
  | "image";

export type IntakeField = {
  key: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
};

export type ToolPricing = {
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  /** Marketing anchor shown next to the price, e.g. "vs. $195/mo at editing agencies". Must be sourced. */
  compareAtText?: string;
};

export type LandingCopy = {
  headline: string;
  subheadline: string;
  bullets: string[];
  howItWorks: Array<{ title: string; text: string }>;
  faq: Array<{ q: string; a: string }>;
  ctaLabel: string;
  guarantee?: string;
  deliveryPromise: string;
};

export type SeoMeta = { title: string; description: string; keywords: string[] };

export type OutputDraft = {
  type: OutputType;
  title: string;
  content?: unknown;
  previewText?: string;
  file?: { name: string; mime: string; data: Buffer };
};

export type QcResult = { passed: boolean; notes: string[] };

export type PipelineResult = {
  outputs: OutputDraft[];
  qc: QcResult;
  /** MANUAL/HYBRID tools return true: the order stops in REVIEW for a human to finish/approve. */
  needsHuman: boolean;
};

export type PipelineContext<TIntake> = {
  orderId: string;
  orderNumber: number;
  customerEmail: string;
  intake: TIntake;
  ai: {
    complete: (call: AiCall, purpose: string) => Promise<{ text: string; costMicros: number }>;
    completeStructured: <T>(
      call: AiCall & { schemaName: string; jsonSchema: Record<string, unknown>; parse: (raw: unknown) => T },
      purpose: string,
    ) => Promise<{ data: T; costMicros: number }>;
    ctx: AiCallContext;
  };
  step: (name: string, note?: string) => void;
};

/** What the customer hands over and what comes back — shown on every card so the result is obvious in seconds. */
export type ToolIo = {
  /** e.g. "Walkthrough video link + listing facts" */
  input: string;
  /** e.g. "5 vertical clips (MP4) with captions" */
  output: string;
  /** Human-readable time to result, e.g. "48 hours" or "About 5 minutes" */
  processingTime: string;
  /** Card / hero button label, e.g. "Create clips" */
  ctaLabel: string;
};

export type ToolDefinition<TIntake = Record<string, unknown>> = {
  id: string;
  slug: string;
  name: string;
  category: string; // real-estate | photography | handymen | ...
  tagline: string;
  description: string;
  /** Input → output summary for cards and share images. */
  io: ToolIo;
  /** Featured tools are shown first on the home page. Non-featured tools still appear in /tools and their category. */
  featured?: boolean;
  /** Hide a tool from public listings without removing it (orders and admin still work). Default true. */
  active?: boolean;
  fulfillment: Fulfillment;
  initialStatus: ToolStatus;
  version: number;
  intake: { fields: IntakeField[]; schema: z.ZodType<TIntake> };
  pricing: ToolPricing;
  sla: { deliveryHours: number };
  landing: LandingCopy;
  seo: SeoMeta;
  delivery: { emailSubject: string; emailIntro: string };
  /** Concierge checklist shown to the admin on manual orders. */
  conciergeChecklist?: string[];
  run: (ctx: PipelineContext<TIntake>) => Promise<PipelineResult>;
};

/** Public, serializable snapshot stored in Tool.config (no functions). */
export type ToolConfigSnapshot = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  fulfillment: Fulfillment;
  version: number;
  pricing: ToolPricing;
  sla: { deliveryHours: number };
  intakeFields: IntakeField[];
};
