import { prisma } from "@/lib/db";
import { env, adminEmails, appUrl } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";
import type { User } from "@prisma/client";

const MAGIC_TTL_MINUTES = 20;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Create (or fetch) the user row for an email. Admins are decided by ADMIN_EMAILS, never by client input. */
export async function upsertUserByEmail(emailRaw: string, name?: string | null): Promise<User> {
  const email = normalizeEmail(emailRaw);
  const role = adminEmails().includes(email) ? "ADMIN" : "CUSTOMER";
  return prisma.user.upsert({
    where: { email },
    create: { email, name: name ?? undefined, role },
    update: { role, ...(name ? { name } : {}) },
  });
}

export async function issueMagicLink(emailRaw: string, redirect?: string): Promise<{ url: string }> {
  const email = normalizeEmail(emailRaw);
  const token = randomToken(32);
  await prisma.magicLinkToken.create({
    data: {
      email,
      tokenHash: sha256(token),
      redirect: redirect && redirect.startsWith("/") ? redirect : null,
      expiresAt: new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000),
    },
  });
  const url = appUrl(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  await sendEmail({
    to: email,
    subject: `Your ${env().NEXT_PUBLIC_BRAND_NAME} sign-in link`,
    text: `Click to sign in (valid ${MAGIC_TTL_MINUTES} minutes): ${url}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Click to sign in (valid ${MAGIC_TTL_MINUTES} minutes):</p><p><a href="${url}">${url}</a></p><p>If you did not request this, ignore this email.</p>`,
  });
  return { url };
}

export async function consumeMagicLink(token: string): Promise<{ user: User; redirect: string }> {
  const row = await prisma.magicLinkToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new AppError("This sign-in link is invalid or expired. Request a new one.", 400, "invalid_magic_link");
  }
  await prisma.magicLinkToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  const user = await upsertUserByEmail(row.email);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { user, redirect: row.redirect ?? "/dashboard" };
}
