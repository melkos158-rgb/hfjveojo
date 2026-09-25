import Link from "next/link";
import { site } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";

export async function Nav() {
  const session = await getSession();
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-wide text-ink">
          {site.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-gray-700">
          <Link href="/real-estate" className="hidden hover:text-ink sm:inline">
            Real estate
          </Link>
          <Link href="/photographers" className="hidden hover:text-ink sm:inline">
            Photographers
          </Link>
          <Link href="/tools" className="hover:text-ink">
            All tools
          </Link>
          <Link href="/pricing" className="hidden hover:text-ink sm:inline">
            Pricing
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-ink">
                My orders
              </Link>
              {isAdmin(session) && (
                <Link href="/admin" className="rounded-md bg-ink px-3 py-1.5 text-white hover:bg-ink-soft">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
