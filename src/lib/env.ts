import { z } from "zod";

/**
 * Server-side environment. Validated once at first import.
 * Anything prefixed NEXT_PUBLIC_ may reach the browser; everything else is a server secret.
 * Never import this file from a client component ("use client" files) — it is also used by the worker,
 * so it must stay a plain Node module.
 */
const schema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  NODE_ENV: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_BRAND_NAME: z.string().default("ORVIONIS"),
  ADMIN_EMAILS: z.string().default(""),

  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SIGNING_SECRET: z.string().min(16),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_CURRENCY: z.string().default("usd"),

  AI_PROVIDER: z.enum(["openai", "anthropic", "mock"]).default("openai"),
  OPENAI_API_KEY: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  AI_MODEL_CHEAP: z.string().default("gpt-4.1-mini"),
  AI_MODEL_STANDARD: z.string().default("gpt-4.1"),
  AI_MODEL_BEST: z.string().default("gpt-4.1"),
  AI_DAILY_BUDGET_CENTS: z.coerce.number().int().nonnegative().default(500),
  AI_MAX_COST_PER_ORDER_CENTS: z.coerce.number().int().nonnegative().default(100),
  AI_PRICE_TABLE_JSON: z.string().optional().default(""),
  /** Image edits (virtual staging). Cost is charged per output image: AI_IMAGE_COST_CENTS × images (plus a small input charge). */
  AI_IMAGE_MODEL: z.string().default("gpt-image-1"),
  AI_IMAGE_QUALITY: z.enum(["low", "medium", "high"]).default("medium"),
  AI_IMAGE_COST_CENTS: z.coerce.number().nonnegative().default(6),

  /** Google sign-in is offered on /login only when both are set (OAuth client → Authorized redirect URI: <APP_URL>/api/auth/google/callback). */
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  EMAIL_PROVIDER: z.enum(["resend", "console"]).default("console"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("ORVIONIS <hello@orvionis.com>"),
  EMAIL_REPLY_TO: z.string().optional().default(""),

  STORAGE_BACKEND: z.enum(["db", "s3"]).default("db"),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("auto"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  FILE_RETENTION_DAYS_OUTPUT: z.coerce.number().int().positive().default(90),
  FILE_RETENTION_DAYS_INPUT: z.coerce.number().int().positive().default(30),

  JOBS_INLINE: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  WORKER_POLL_MS: z.coerce.number().int().positive().default(2000),
  /** Job loop inside the web process (single-service deployments). Set false once a dedicated worker runs. */
  EMBEDDED_WORKER: z
    .string()
    .optional()
    .default("true")
    .transform((v) => !(v === "false" || v === "0")),
  EMBEDDED_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
  EMBEDDED_WORKER_POLL_MS: z.coerce.number().int().positive().default(10_000),
  CRON_SECRET: z.string().min(1).default("change-me"),

  /** Optional HTML-tag verification for Search Console / Bing (public values; DNS TXT verification needs none). */
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional().default(""),
  NEXT_PUBLIC_BING_SITE_VERIFICATION: z.string().optional().default(""),
  SENTRY_DSN: z.string().optional().default(""),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return env().APP_ENV === "production";
}

export function adminEmails(): string[] {
  return env()
    .ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function appUrl(path = ""): string {
  const base = env().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
