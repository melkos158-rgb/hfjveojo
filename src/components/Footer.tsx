import Link from "next/link";
import { site } from "@/config/site";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-mist">
      <div className="container-x grid gap-8 py-10 text-sm text-gray-600 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-ink">
            <BrandMark size={24} />
            <span>{site.name}</span>
          </div>
          <p className="mt-2 max-w-xs">{site.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/tools" className="hover:text-ink">
            All tools
          </Link>
          <Link href="/real-estate" className="hover:text-ink">
            Real estate
          </Link>
          <Link href="/photographers" className="hover:text-ink">
            Photographers
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/guides/ab-723-virtual-staging" className="hover:text-ink">
            AB 723 guide
          </Link>
          <Link href="/free" className="hover:text-ink">
            Free tools
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
        <div className="grid gap-2">
          <Link href="/terms" className="hover:text-ink">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-ink">
            Refund Policy
          </Link>
          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} {site.name}. Payments by Stripe.
          </span>
        </div>
      </div>
    </footer>
  );
}
