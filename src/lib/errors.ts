import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

export class AppError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "not_found");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "forbidden");
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "rate_limited");
  }
}

/**
 * Persist an error for the admin /system page and forward to Sentry if configured.
 * Never throws.
 */
export async function reportError(err: unknown, context?: Record<string, unknown>): Promise<void> {
  const e = err instanceof Error ? err : new Error(String(err));
  log.error(e.message, { stack: e.stack, ...context });
  try {
    await prisma.errorLog.create({
      data: {
        level: "error",
        message: e.message.slice(0, 2000),
        stack: e.stack?.slice(0, 8000),
        context: (context as object) ?? undefined,
      },
    });
  } catch {
    // database might be the thing that is down; stdout already has it
  }
  // Sentry hook: when SENTRY_DSN is set, install @sentry/nextjs and call Sentry.captureException(e) here.
}

export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json({ error: err.code, message: err.message }, { status: err.status });
  }
  void reportError(err);
  return Response.json({ error: "internal_error", message: "Something went wrong" }, { status: 500 });
}
