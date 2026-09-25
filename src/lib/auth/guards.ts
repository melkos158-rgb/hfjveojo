import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { adminEmails } from "@/lib/env";

/** For server components/pages: redirect to login when not signed in. */
export async function requireUserPage(nextPath: string): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return s;
}

/** For server components/pages: admins only. Role comes from the signed session + ADMIN_EMAILS, never from the client. */
export async function requireAdminPage(nextPath: string): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!isAdmin(s)) redirect("/dashboard?denied=1");
  return s;
}

/** For route handlers: throws typed errors mapped to 401/403. */
export async function requireUserApi(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new UnauthorizedError();
  return s;
}

export async function requireAdminApi(): Promise<SessionUser> {
  const s = await requireUserApi();
  if (!isAdmin(s)) throw new ForbiddenError();
  return s;
}

export function isAdmin(s: SessionUser | null): boolean {
  if (!s) return false;
  return s.role === "ADMIN" && adminEmails().includes(s.email.toLowerCase());
}
