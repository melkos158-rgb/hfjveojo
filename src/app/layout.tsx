import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/config/site";
import { brand } from "@/config/brand";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { gaInitScript, validGaId } from "@/lib/ga";

/** GA4 only on production and only with a valid measurement id (a public value, not a secret). */
function gaMeasurementId(): string | null {
  return process.env.APP_ENV === "production" ? validGaId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) : null;
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  // No openGraph.title/description here on purpose: each page's own title/description then flows into og:* tags.
  openGraph: { siteName: site.name, type: "website", url: site.url },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  // Search Console / Bing verification by HTML tag (optional; DNS TXT verification needs no variable).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
};

/** Browser UI colour (mobile address bar, PWA splash) = the brand background. */
export const viewport: Viewport = { themeColor: brand.colors.background };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = gaMeasurementId();
  return (
    <html lang="en">
      {gaId ? (
        <head>
          {/* gtag must exist before any component effect runs (purchase / begin_checkout events) */}
          <script dangerouslySetInnerHTML={{ __html: gaInitScript(gaId) }} />
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
        </head>
      ) : null}
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent analytics={Boolean(gaId)} />
        <Analytics />
        {gaId ? <GoogleAnalytics /> : null}
      </body>
    </html>
  );
}
