import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { StagingCostCalculator } from "@/components/StagingCostCalculator";
import { compareStagingCost, NAR_MEDIAN_STAGING_SERVICE, PER_PHOTO_OPTIONS, STAGING_PRICES_CHECKED, SUBSCRIPTION_PLANS } from "@/lib/free/staging-cost";

const PATH = "/free/virtual-staging-cost-calculator";

export const metadata: Metadata = {
  title: "Virtual staging cost calculator: price per listing (2026)",
  description:
    "What virtual staging costs for your listings: editors at $24–$30 a photo, AI plans from $16/month (yearly), pay-per-photo AI at $15. Prices checked Oct 6, 2026.",
  keywords: ["virtual staging cost calculator", "virtual staging pricing", "virtual staging cost", "how much does virtual staging cost", "virtual staging price per photo"],
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: `Virtual staging cost calculator | ${site.name}`,
    description: "Price your listing: pay-per-photo human editors, AI subscriptions and pay-per-photo AI side by side, from published prices.",
    url: `${site.url}${PATH}`,
  },
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const typical = compareStagingCost(5, 1);
const cheapest = PER_PHOTO_OPTIONS[0];
const priciest = PER_PHOTO_OPTIONS[PER_PHOTO_OPTIONS.length - 1];
const smallPlan = SUBSCRIPTION_PLANS[0];
const bigPlan = SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1];

const FAQ = [
  {
    q: "How much does virtual staging cost per photo?",
    a: `Human editors charge $24 (VirtualStaging.com) to $30 (BoxBrownie) per photo. ORVIONIS charges ${money(cheapest.perPhoto)} per photo, $12 each from 5 photos and $99 for 10, with two versions of each. AI subscriptions such as Virtual Staging AI run ${money(smallPlan.perMonth)} a month for ${smallPlan.photosPerMonth} photos up to ${money(bigPlan.perMonth)} for ${bigPlan.photosPerMonth}, with yearly billing. Prices checked ${STAGING_PRICES_CHECKED}.`,
  },
  {
    q: "How much does it cost to virtually stage a whole listing?",
    a: `A typical vacant listing needs four to six staged photos. Five photos cost ${money(typical.perPhoto[0].perListing)} with ORVIONIS ($12 each from five), ${money(typical.perPhoto[1].perListing)} at $24 and ${money(typical.perPhoto[2].perListing)} at $30 per photo. For scale, NAR's 2025 Profile of Home Staging puts the median cost of a staging service (real furniture) at ${money(NAR_MEDIAN_STAGING_SERVICE)} per home.`,
  },
  {
    q: "Is an AI subscription cheaper than paying per photo?",
    a: `Only if you stage every month and use the credits. The ${smallPlan.name} plan is ${money(smallPlan.perMonth)} a month but billed as ${money(smallPlan.billedYearly)} a year up front, so a one-off listing of five photos is cheaper per photo (${money(typical.oneOff.cost)}). If you stage the same volume every month, the plan wins on price.`,
  },
  {
    q: "Where do these prices come from?",
    a: "From each provider's own price page or pricing article, checked on the date shown, and from NAR's 2025 Profile of Home Staging. Sources are linked below. The calculator runs in your browser; nothing you type is sent anywhere.",
  },
];

const SOURCES = [
  { text: "BoxBrownie pricing: virtual staging US$30 per image (checked October 6, 2026)", href: "https://www.boxbrownie.com/pricing", label: "boxbrownie.com/pricing" },
  { text: "BoxBrownie virtual staging: under 48 hours, free changes within 2 months", href: "https://www.boxbrownie.com/virtual-staging", label: "boxbrownie.com/virtual-staging" },
  { text: "VirtualStaging.com pricing: $24 per image ($19.20 with their bulk discount), 24-hour ETA, 4–8-hour rush (checked October 6, 2026)", href: "https://virtualstaging.com/pricing", label: "virtualstaging.com/pricing" },
  { text: "Virtual Staging AI plans with yearly billing: Basic $16/mo (6 photos, $192 a year) to Enterprise $79/mo (150 photos); billed monthly, the same plans are $25 to $139 a month (checked October 6, 2026)", href: "https://www.virtualstagingai.app/prices", label: "virtualstagingai.app/prices" },
  { text: "NAR 2025 Profile of Home Staging: median $1,500 when a staging service staged the home", href: "https://www.nar.realtor/infographics/2025-profile-of-home-staging-snapshot", label: "nar.realtor" },
];

export default function StagingCostCalculatorPage() {
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Virtual staging cost calculator",
    url: `${site.url}${PATH}`,
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
          <p className="eyebrow">Free tool · real estate agents</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Virtual staging cost calculator</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            How many photos per listing, how many listings a month — and what that costs with a human editor ({money(PER_PHOTO_OPTIONS[1].perPhoto)}–{money(priciest.perPhoto)} a photo), an AI subscription
            (from {money(smallPlan.perMonth)} a month) or pay-per-photo AI ({money(cheapest.perPhoto)}). Published prices, checked {STAGING_PRICES_CHECKED}.
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        <StagingCostCalculator />
      </section>

      <section className="container-x py-10">
        <h2 className="text-2xl font-bold">How to read the result</h2>
        <ol className="mt-4 grid gap-4 lg:grid-cols-3">
          <li className="card">
            <p className="font-semibold text-fg">A listing now and then</p>
            <p className="mt-2 text-sm text-gray-600">Pay per photo. A yearly subscription is paid up front, so it only pays off if you stage every month.</p>
          </li>
          <li className="card">
            <p className="font-semibold text-fg">Dozens of photos every month</p>
            <p className="mt-2 text-sm text-gray-600">A subscription is the cheapest per photo — as long as you use its credits. Unused credits are money spent.</p>
          </li>
          <li className="card">
            <p className="font-semibold text-fg">Price is not the only line</p>
            <p className="mt-2 text-sm text-gray-600">
              Check turnaround, revisions and disclosure: most MLSs require virtually staged photos to be labeled. The{" "}
              <Link href="/guides/virtual-staging-cost" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
                virtual staging cost guide
              </Link>{" "}
              compares these in detail.
            </p>
          </li>
        </ol>
      </section>

      <section className="container-x grid gap-10 py-10 lg:grid-cols-2">
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
        </div>
        <div className="card h-fit">
          <p className="eyebrow">Also free</p>
          <h3 className="mt-2 text-lg font-bold">Which rooms should you stage?</h3>
          <p className="mt-2 text-sm text-gray-600">Buyers&apos; agents rank the living room, primary bedroom and kitchen highest (NAR 2025). A plan for one to six photos.</p>
          <Link href="/guides/which-rooms-to-virtually-stage" className="btn-secondary mt-4">
            Read the guide
          </Link>
        </div>
      </section>

      <section className="container-x pb-14">
        <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Sources</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {SOURCES.map((s) => (
            <li key={s.href}>
              {s.text}:{" "}
              <a href={s.href} rel="nofollow noopener" target="_blank" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">Prices change; each provider&apos;s own page is the final word. ORVIONIS is one of the options compared.</p>
      </section>
    </div>
  );
}
