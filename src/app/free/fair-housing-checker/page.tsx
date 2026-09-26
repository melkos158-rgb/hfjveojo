import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { FairHousingChecker } from "@/components/FairHousingChecker";
import { FAIR_HOUSING_RULES } from "@/lib/tools/qa";

export const metadata: Metadata = {
  title: "Free fair housing checker for listing descriptions",
  description:
    "Paste your MLS listing description and see risky fair-housing phrases highlighted with a rewrite hint, plus a live character count for your board's limit. Free, runs in your browser.",
  keywords: ["fair housing checker", "fair housing compliant listing description", "MLS description character limit", "listing description words to avoid", "real estate ad compliance"],
  alternates: { canonical: "/free/fair-housing-checker" },
  openGraph: {
    type: "website",
    title: `Free fair housing checker for listing descriptions | ${site.name}`,
    description: "Highlights risky phrases in your listing copy with a rewrite hint for each, and counts characters against your MLS limit.",
    url: `${site.url}/free/fair-housing-checker`,
  },
};

const FAQ = [
  {
    q: "What does the checker look for?",
    a: `A lexicon of ${FAIR_HOUSING_RULES.length} phrases that describe who should live in a home instead of the home itself — familial status (“perfect for families”, “no kids”), religion (“near the church”), age (“mature adults”), national origin and disability wording — plus style flags such as “master bedroom”, which many MLS boards now replace with “primary”.`,
  },
  {
    q: "Is a clean result a legal guarantee?",
    a: "No. It catches the common phrases; it does not read intent or context, and state and local rules add their own restrictions. Treat it as a first pass, not legal advice.",
  },
  {
    q: "Where does my text go?",
    a: "Nowhere. The check runs in your browser with a fixed word list. We record only that the tool was used, never the text.",
  },
  {
    q: "Why do MLS character limits matter?",
    a: "Most boards cut public remarks at 1,000 characters (some at 500 or 1,500). Copy that is trimmed by the system usually loses the call to action at the end — the open house, the agent, the link.",
  },
];

/** Free lead-magnet tool: same fair-housing rules the paid Listing Description tool enforces before delivery. */
export default function FairHousingCheckerPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Fair housing checker for listing descriptions",
    url: `${site.url}/free/fair-housing-checker`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="bg-mist">
        <div className="container-x py-14">
          <p className="eyebrow">Free tool · real estate</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Fair housing checker for listing descriptions</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            Paste the remarks you are about to publish. Risky phrases light up with a rewrite hint, and the counter shows how close you are to your board&apos;s character limit. Free, instant, in your browser.
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        <FairHousingChecker />
      </section>

      <section className="container-x grid gap-10 py-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">What gets flagged</h2>
          <p className="mt-2 text-sm text-gray-600">The list the checker uses, with the protected class each phrase touches.</p>
          <ul className="mt-4 space-y-2">
            {FAIR_HOUSING_RULES.map((r) => (
              <li key={r.label} className="flex items-start gap-3 text-sm">
                <span className={`badge mt-0.5 shrink-0 ${r.severity === "risk" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{r.severity === "risk" ? "Risk" : "Style"}</span>
                <span>
                  <span className="font-semibold text-fg">{r.label}</span> <span className="text-gray-500">— {r.basis}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold">Questions</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-sm text-gray-600">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 card">
            <p className="eyebrow">Done for you</p>
            <h3 className="mt-2 text-lg font-bold">Listing Description — $9</h3>
            <p className="mt-2 text-sm text-gray-600">Send the address, price, stats and the five things worth mentioning. About five minutes later: an MLS description within your limit, a long version for your site, three captions, hashtags and an email blurb — checked with these same rules before delivery.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/tools/listing-description" className="btn-primary">
                Write my listing
              </Link>
              <Link href="/tools/listing-description#example" className="btn-secondary">
                See an example
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
