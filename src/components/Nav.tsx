import Link from "next/link";
import { site } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import { BrandMark } from "@/components/BrandMark";

export async function Nav() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-wide text-ink sm:gap-2.5 sm:text-lg" aria-label={`${site.name} — home`}>
          <BrandMark size={32} />
          <span>{site.name}</span>
        </Link>
        <nav className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-gray-700 sm:gap-5">
          <Link href="/real-estate" className="hidden hover:text-ink sm:inline">
            Real estate
          </Link>
          <Link href="/photographers" className="hidden hover:text-ink sm:inline">
            Photographers
          </Link>
          {/* Phones: "Get started" already leads to the tools, so this link only shows there for signed-in customers. */}
          <Link href="/tools" className={session && !isAdmin(session) ? "hover:text-ink" : "hidden hover:text-ink sm:inline"}>
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
          <span className={session ? "hidden sm:inline" : "inline"}>
            <Link href="/tools" className="btn-primary btn-pill">
              Get started
            </Link>
          </span>
        </nav>
      </div>
    </header>
  );
}
