import Link from "next/link";
import { site } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";

export async function Nav() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-wide text-ink">
          {site.name}
        </Link>
        <nav className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-gray-700 sm:gap-5">
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
                <Link href="/admin" className="rounded-md border border-line bg-card px-3 py-1.5 text-fg hover:bg-card-2">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          )}
          <Link href="/tools" className="btn-primary btn-pill">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
