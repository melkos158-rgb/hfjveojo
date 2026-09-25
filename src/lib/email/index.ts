import { env } from "@/lib/env";
import { log } from "@/lib/logger";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/**
 * Email provider abstraction. "resend" uses Resend's HTTP API (no SDK needed); "console" logs the message.
 * Any provider with an HTTP API can be added here without touching callers.
 */
export async function sendEmail(msg: EmailMessage): Promise<{ id: string | null }> {
  const e = env();
  if (e.EMAIL_PROVIDER === "console" || !e.RESEND_API_KEY) {
    log.info("email.console", { to: msg.to, subject: msg.subject, text: msg.text.slice(0, 500) });
    return { id: null };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: e.EMAIL_FROM,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html ?? undefined,
      reply_to: msg.replyTo ?? e.EMAIL_REPLY_TO ?? undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string };
  return { id: data.id ?? null };
}
