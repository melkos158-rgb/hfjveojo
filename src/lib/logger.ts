/**
 * Structured JSON logger. Railway captures stdout/stderr, so JSON lines are searchable there.
 * Errors are additionally persisted via reportError() (see ./errors.ts).
 */
type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const lvl = (process.env.LOG_LEVEL as Level) || "info";
  return order[lvl] ?? 20;
}

function emit(level: Level, msg: string, ctx?: Record<string, unknown>) {
  if (order[level] < threshold()) return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...(ctx ?? {}) });
  if (level === "error" || level === "warn") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
};
