import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "orv_session";

export type SessionUser = { id: string; email: string; role: UserRole; name?: string | null };

function key(): Uint8Array {
  return new TextEncoder().encode(env().AUTH_SECRET);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const ttl = env().SESSION_TTL_DAYS * 24 * 3600;
  return new SignJWT({ email: user.email, role: user.role, name: user.name ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      role: (payload.role as UserRole) ?? "CUSTOMER",
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().APP_ENV === "production" || env().APP_ENV === "staging",
    path: "/",
    maxAge: env().SESSION_TTL_DAYS * 24 * 3600,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Read the current session from cookies (server components, route handlers). Returns null when logged out. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
