import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";
import { StagingCostCalculator } from "@/components/StagingCostCalculator";
import { priceRanges, STAGING_PRICES, usd } from "@/content/staging-prices";
import { compareStagingCost, NAR_MEDIAN_STAGING_SERVICE, STAGING_PRICES_CHECKED, SUBSCRIPTION_NAME, SUBSCRIPTION_PLANS } from "@/lib/free/staging-cost";

const PATH = "/free/virtual-staging-cost-calculator";

const ranges = priceRanges();
const smallPlan = SUBSCRIPTION_PLANS[0];
const bigPlan = SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1];
const typical = compareStagingCost(5, 1);
const at = (key: string) => STAGING_PRICES.find((p) => p.key === key)!;
/** "PhotoUp (AI)" → "PhotoUp", "ORVIONIS (ours)" → "ORVIONIS", "Apply Design (One-click)" → "Apply Design One-click". */
const shortName = (company: string) => company.replace(/ \((ours|AI)\)$/, "").replace(/ \(([^)]+)\)$/, " $1");
const joinNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]);
/** Pay-per-photo AI rows (not the do-it-yourself editor) at the low and high end of the one-photo range. */
const aiRows = STAGING_PRICES.filter((p) => p.group === "per-photo" && p.key !== "applydesign-diy");
const aiCheapestRows = aiRows.filter((p) => p.onePhoto === ranges.aiPerPhoto[0]);
const aiCheapest = aiCheapestRows.length === 1 ? `${shortName(aiCheapestRows[0].company)}: ${aiCheapestRows[0].onePhotoNote}` : joinNames(aiCheapestRows.map((p) => shortName(p.company)));
const aiPriciest = joinNames(aiRows.filter((p) => p.onePhoto === ranges.aiPerPhoto[1]).map((p) => shortName(p.company)));
const designers5 = typical.perPhoto.filter((o) => o.group === "designer").map((o) => o.perListing);
const perPhoto5 = typical.perPhoto.filter((o) => o.group === "per-photo" && !o.ours);

const DESCRIPTION = `Price a listing at nine virtual staging companies: design services ${usd(ranges.designerOnePhoto[0])}–${usd(ranges.designerOnePhoto[1])} a photo, pay-per-photo AI from ${usd(ranges.aiPerPhoto[0])}, plans from ${usd(smallPlan.monthly)} a month. Checked ${STAGING_PRICES_CHECKED.replace("October", "Oct")}.`;

export const metadata: Metadata = {
  title: "Virtual staging cost calculator: 9 companies compared (2026)",
  description: DESCRIPTION,
  keywords: ["virtual staging cost calculator", "virtual staging pricing", "virtual staging cost", "how much does virtual staging cost", "virtual staging price per photo"],
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: `Virtual staging cost calculator | ${site.name}`,
    description: "Price your listing at nine companies: design services, pay-per-photo AI and an AI subscription side by side, from published prices.",
    url: `${site.url}${PATH}`,
  },
};

const FAQ = [
  {
    q: "How much does virtual staging cost per photo?",
    a: `Design services, where an editor or designer stages each photo, charge ${usd(ranges.designerOnePhoto[0])}–${usd(ranges.designerOnePhoto[1])} for one photo and ${usd(ranges.designerBulk[0])}–${usd(ranges.designerBulk[1])} each on bigger orders. Pay-per-photo AI costs from ${usd(ranges.aiPerPhoto[0])} (${aiCheapest}) to ${usd(ranges.aiPerPhoto[1])} (${aiPriciest}); Apply Design's do-it-yourself editor is ${usd(at("applydesign-diy").onePhoto)} a photo. ORVIONIS is ${STAGING_PRICE_LINE}, with two versions of each photo. Prices checked ${STAGING_PRICES_CHECKED}.`,
  },
  {
    q: "How much does it cost to virtually stage a whole listing?",
    a: `A typical vacant listing needs four to six staged photos. For five, the design services charge ${usd(Math.min(...designers5))}–${usd(Math.max(...designers5))}, the other pay-per-photo options ${usd(perPhoto5[0].perListing)}${perPhoto5[0].from ? " (at least)" : ""} to ${usd(perPhoto5[perPhoto5.length - 1].perListing)}, one month of ${SUBSCRIPTION_NAME}'s ${typical.subscriptionOneOff.plan.photosPerMonth}-photo plan ${usd(typical.subscriptionOneOff.cost)}, and ORVIONIS ${usd(typical.ours.perListing)} with the MLS description included. For scale, NAR's 2025 Profile of Home Staging puts the median cost of a staging service (real furniture) at $${NAR_MEDIAN_STAGING_SERVICE.toLocaleString("en-US")} per home.`,
  },
  {
    q: "Is an AI subscription cheaper than paying per photo?",
    a: `It depends on how often you stage. Billed month to month, ${SUBSCRIPTION_NAME}'s smallest plan is ${usd(smallPlan.monthly)} for ${smallPlan.photosPerMonth} photos, and you can cancel after one listing. Billed yearly it is ${usd(smallPlan.yearlyPerMonth)} a month, but the ${usd(smallPlan.billedYearly)} is paid up front, so it only pays off if you stage every month and use the credits. Paying per photo costs nothing in the months you don't stage.`,
  },
  {
    q: "Where do these prices come from?",
    a: "From each company's own price page, checked on the date shown (the same table as our virtual staging cost guide), and from NAR's 2025 Profile of Home Staging. Sources are linked below. The calculator runs in your browser; nothing you type is sent anywhere.",
  },
];

/** Each company's own price page (the guide's table), then NAR. */
const SOURCES = [
  ...STAGING_PRICES.map((p) => ({ key: p.key, company: p.company, price: p.price, links: p.sources })),
  {
    key: "nar",
    company: "NAR 2025 Profile of Home Staging",
    price: "median $1,500 when a staging service staged the home",
    links: [{ label: "nar.realtor", href: "https://www.nar.realtor/infographics/2025-profile-of-home-staging-snapshot" }],
  },
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
            How many photos per listing, how many listings a month — and what that costs at nine companies: design services ({usd(ranges.designerOnePhoto[0])}–{usd(ranges.designerOnePhoto[1])} a photo), pay-per-photo AI
            (from {usd(ranges.aiPerPhoto[0])}) and an AI subscription ({usd(smallPlan.monthly)}–{usd(bigPlan.monthly)} a month, or {usd(smallPlan.yearlyPerMonth)}–{usd(bigPlan.yearlyPerMonth)} billed yearly). Published prices, checked{" "}
            {STAGING_PRICES_CHECKED}.
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
            <p className="mt-2 text-sm text-gray-600">Pay per photo, or take one month of a plan and cancel it. A yearly subscription is paid up front, so it only pays off if you stage every month.</p>
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
            <li key={s.key}>
              {s.company} — {s.price}:{" "}
              {s.links.map((l, i) => (
                <span key={l.href}>
                  {i > 0 ? " · " : null}
                  <a href={l.href} rel="nofollow noopener" target="_blank" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
                    {l.label}
                  </a>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">Prices change; each provider&apos;s own page is the final word. ORVIONIS is one of the options compared.</p>
      </section>
    </div>
  );
}
