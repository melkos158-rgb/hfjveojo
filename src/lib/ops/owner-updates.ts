import { prisma } from "@/lib/db";
import { adminEmails, env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import { OWNER_UPDATES, type OwnerUpdate } from "@/content/owner-updates";

/**
 * Operator → owner email updates. Each entry of `OWNER_UPDATES` is emailed once to every ADMIN_EMAILS address, from
 * EMAIL_FROM. Sent ids are kept in the `Setting` row below, so a redeploy or restart never sends one twice. A failed
 * send is not recorded, and the job loop retries it a few minutes later (at-least-once: a crash between the send and
 * the write can repeat one email, which beats losing it).
 */
export const OWNER_UPDATES_SETTING = "ops.owner_updates";
/** At most this many emails per run, so a backlog never arrives as a burst. */
export const OWNER_UPDATES_PER_RUN = 3;

export type OwnerUpdatesRecord = { sent: string[]; at?: string };
export type OwnerUpdatesOutcome =
  | { sent: string[]; failed: string | null }
  | { skipped: "not production" | "no admin email" | "nothing new" };

type Store = {
  setting: {
    findUnique(args: { where: { key: string } }): Promise<{ value: unknown } | null>;
    upsert(args: { where: { key: string }; create: { key: string; value: OwnerUpdatesRecord }; update: { value: OwnerUpdatesRecord } }): Promise<unknown>;
  };
};
type Send = (msg: { to: string; subject: string; text: string }) => Promise<unknown>;

export function parseOwnerUpdatesRecord(value: unknown): OwnerUpdatesRecord {
  const sent = (value as { sent?: unknown } | null)?.sent;
  return { sent: Array.isArray(sent) ? sent.filter((s): s is string => typeof s === "string") : [] };
}

/** Updates not sent yet, in file order. */
export function pendingOwnerUpdates(all: readonly OwnerUpdate[], sent: readonly string[]): OwnerUpdate[] {
  const done = new Set(sent);
  return all.filter((u) => !done.has(u.id));
}

export async function sendPendingOwnerUpdates(
  opts: { appEnv?: string; recipients?: string[]; updates?: readonly OwnerUpdate[]; db?: Store; send?: Send; brand?: string; now?: Date } = {},
): Promise<OwnerUpdatesOutcome> {
  const appEnv = opts.appEnv ?? env().APP_ENV;
  if (appEnv !== "production") return { skipped: "not production" };
  const recipients = opts.recipients ?? adminEmails();
  if (!recipients.length) return { skipped: "no admin email" };

  const db = opts.db ?? prisma;
  const send = opts.send ?? sendEmail;
  const brand = opts.brand ?? env().NEXT_PUBLIC_BRAND_NAME;
  const row = await db.setting.findUnique({ where: { key: OWNER_UPDATES_SETTING } });
  const record = parseOwnerUpdatesRecord(row?.value);
  const pending = pendingOwnerUpdates(opts.updates ?? OWNER_UPDATES, record.sent).slice(0, OWNER_UPDATES_PER_RUN);
  if (!pending.length) return { skipped: "nothing new" };

  const sent: string[] = [];
  for (const update of pending) {
    let delivered = 0;
    for (const to of recipients) {
      try {
        await send({ to, subject: `[${brand}] ${update.subject}`, text: update.text });
        delivered++;
      } catch (err) {
        log.warn("owner_updates.send_failed", { id: update.id, error: (err as Error).message });
      }
    }
    // Keep the order: an update nobody received is retried first, before any newer one goes out.
    if (!delivered) return { sent, failed: update.id };
    record.sent = [...record.sent, update.id];
    const value: OwnerUpdatesRecord = { sent: record.sent, at: (opts.now ?? new Date()).toISOString() };
    await db.setting.upsert({ where: { key: OWNER_UPDATES_SETTING }, create: { key: OWNER_UPDATES_SETTING, value }, update: { value } });
    sent.push(update.id);
    log.info("owner_updates.sent", { id: update.id, recipients: delivered });
  }
  return { sent, failed: null };
}
