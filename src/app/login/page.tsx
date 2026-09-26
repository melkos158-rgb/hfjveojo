import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { googleEnabled } from "@/lib/auth/google";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const google = googleEnabled();
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <div className="container-x max-w-md py-16">
      <div className="card">
        <BrandMark size={48} className="mb-4" />
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">No password. {google ? "Use your Google account, or we email you a one-time link." : "We email you a one-time link that signs you in and shows your orders."}</p>
        {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {google ? (
          <>
            <a href={`/api/auth/google${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`} className="btn-secondary mt-5 w-full">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48" className="mr-2">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
                <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
              </svg>
              Continue with Google
            </a>
            <div className="mt-5 flex items-center gap-3 text-xs text-gray-500">
              <span className="h-px flex-1 bg-line" />
              or get a link by email
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : null}
        <LoginForm next={safeNext} />
      </div>
    </div>
  );
}
