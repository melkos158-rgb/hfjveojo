import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { PricingCalculator } from "@/components/PricingCalculator";
import { computePricing, PRICING_PRESETS } from "@/lib/free/pricing-calc";

export const metadata: Metadata = {
  title: "Photography pricing calculator: real estate & wedding rates",
  description:
    "Free photography pricing calculator for real estate, wedding and portrait photographers: your minimum price per shoot and hour, plus sourced US market rates.",
  keywords: [
    "photography pricing calculator",
    "real estate photography pricing calculator",
    "wedding photography price calculator",
    "how much to charge for real estate photography",
    "how much do wedding photographers charge",
    "photographer hourly rate calculator",
    "cost of doing business photographer",
  ],
  alternates: { canonical: "/free/photography-pricing-calculator" },
  openGraph: {
    type: "website",
    title: `Photography pricing calculator: real estate & wedding rates | ${site.name}`,
    description: "Your minimum price per shoot and per hour from your income goal, costs, taxes and real hours per job, next to sourced US market rates.",
    url: `${site.url}/free/photography-pricing-calculator`,
  },
};

const money = (n: number, cents = false) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

/** The Knot, "average cost of a wedding photographer" (updated May 8, 2026): 2026 Real Weddings Study, 10,474 US couples married in 2025. See Sources. */
const WEDDING = {
  average: 3000,
  tiers: [
    { label: "Average", value: 3000 },
    { label: "Lower cost quartile", value: 1500 },
    { label: "Median", value: 2800 },
    { label: "Upper cost quartile", value: 4700 },
  ],
  regionLow: { name: "Southwest", value: 2600 },
  regionHigh: { name: "Mid-Atlantic", value: 3800 },
  guests: [
    { label: "1–50 guests", value: 2000 },
    { label: "51–100 guests", value: 2700 },
    { label: "101+ guests", value: 3500 },
  ],
};

/** Our arithmetic on the examples, so the page and the calculator never disagree. */
const weddingExample = PRICING_PRESETS.wedding.v;
const weddingHours = weddingExample.shootHours + weddingExample.editHours;
const realEstateExample = PRICING_PRESETS["real-estate"].v;
const realEstateHours = realEstateExample.shootHours + realEstateExample.editHours;
const realEstateFloor = computePricing(realEstateExample).pricePerJob;
const REAL_ESTATE_PACKAGE = 250; // middle of the $150–$350 published range below

const FAQ = [
  {
    q: "How much should I charge for real estate photography?",
    a: `Start from your floor: with the calculator's real estate example (${money(realEstateExample.income)} take-home, ${money(realEstateExample.expenses)} of costs, ${realEstateExample.jobs} shoots a year, ${realEstateHours} hours per shoot including editing and travel), the minimum is about ${money(realEstateFloor)} a shoot. Then compare with the market: Thumbtack's cost guide says most clients pay $100–$125 per hour, and published rate cards show $150–$350 for a standard daytime photo package, with drone, video and 3D tours priced as add-ons.`,
  },
  {
    q: "How much do wedding photographers charge?",
    a: `US couples married in 2025 paid ${money(WEDDING.average)} on average for their wedding photographer, according to The Knot's 2026 Real Weddings Study of 10,474 couples. The median was $2,800; The Knot's lower cost quartile is $1,500 and its upper cost quartile $4,700. Regional averages run from ${money(WEDDING.regionLow.value)} (${WEDDING.regionLow.name}) to ${money(WEDDING.regionHigh.value)} (${WEDDING.regionHigh.name}).`,
  },
  {
    q: "How is the minimum price calculated?",
    a: "Revenue you need = business costs + (take-home income ÷ (1 − tax rate)), because tax is paid on profit, not on costs. That revenue is divided by the jobs you can realistically deliver — capped by your available hours divided by the hours one job takes, including editing and admin.",
  },
  {
    q: "Why does editing time matter so much?",
    a: "An 8-hour wedding is often 40 hours of work once culling, editing, gallery delivery and emails are counted. Pricing on shooting hours alone is how photographers end up earning less than minimum wage.",
  },
  {
    q: "Is this the price I should put on my website?",
    a: "It is the floor. Packages should average above it, slow months need margin, and the market you serve may allow much more. Use it to stop underpricing, then position packages by value.",
  },
  {
    q: "Where does my data go?",
    a: "Nowhere. The calculator runs in your browser; we only record that the tool was used.",
  },
];

const SOURCES = [
  {
    text: "The Knot, “Average cost of a wedding photographer” (updated May 8, 2026): 2026 Real Weddings Study, 10,474 US couples married in 2025; average, quartiles, regions, guest counts",
    href: "https://www.theknot.com/content/average-cost-wedding-photographer",
    label: "theknot.com",
  },
  {
    text: "Thumbtack, real estate photography cost guide (checked September 2026): hourly ranges paid by clients",
    href: "https://www.thumbtack.com/p/real-estate-photography-prices",
    label: "thumbtack.com",
  },
  {
    text: "RealEstatePhotography.com, “Real estate photography pricing: what professionals really charge” (rate cards checked September 19, 2026; advertised prices, not a national survey)",
    href: "https://realestatephotography.com/articles/real-estate-photography-pricing-what-professionals-really-charge",
    label: "realestatephotography.com",
  },
];

export default function PricingCalculatorPage() {
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Photography pricing calculator",
    url: `${site.url}/free/photography-pricing-calculator`,
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
          <p className="eyebrow">Free tool · photographers</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Photography pricing calculator</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            The income you want, your real costs, taxes and the hours a job actually takes — out comes the minimum you must charge per job and per hour, with a check that the plan fits in your year.
            Start from the real estate, wedding, portrait or commercial example, then compare your floor with{" "}
            <a href="#market" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
              what US clients pay
            </a>
            .
          </p>
        </div>
      </section>
      <section className="container-x py-10">
        <PricingCalculator />
      </section>

      <section id="market" className="container-x scroll-mt-24 py-10">
        <p className="eyebrow">Market check</p>
        <h2 className="mt-2 text-2xl font-bold">What photographers charge in the US</h2>
        <p className="mt-3 max-w-3xl text-gray-600">
          The calculator gives your floor, the price below which the work stops paying your costs, taxes and income. These published numbers show where the market sits, so you can see
          how much room there is above it.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-bold">Wedding photography prices</h3>
            <p className="mt-2 text-sm text-gray-600">What US couples married in 2025 paid their photographer (The Knot 2026 Real Weddings Study, 10,474 couples).</p>
            <table className="mt-4 w-full text-left text-sm">
              <tbody>
                {WEDDING.tiers.map((t) => (
                  <tr key={t.label} className="border-t border-line">
                    <td className="py-2 pr-3 text-gray-600">{t.label}</td>
                    <td className="py-2 text-right font-semibold text-fg">{money(t.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm text-gray-600">
              By region, averages run from {money(WEDDING.regionLow.value)} ({WEDDING.regionLow.name}) to {money(WEDDING.regionHigh.value)} ({WEDDING.regionHigh.name}). Size matters too:{" "}
              {WEDDING.guests.map((g) => `${money(g.value)} for ${g.label}`).join(", ")}.
            </p>
            <p className="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-gray-700">
              <strong className="text-fg">What it means for you:</strong> at the {money(WEDDING.average)} average, a wedding that takes {weddingHours} hours in total ({weddingExample.shootHours} shooting
              + {weddingExample.editHours} editing and admin, as in the calculator&apos;s wedding example) pays about {money(WEDDING.average / weddingHours)} per hour of work, before costs and tax.
              The Knot&apos;s own estimate of about $375 an hour counts only the 8-hour day.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold">Real estate photography prices</h3>
            <p className="mt-2 text-sm text-gray-600">
              Thumbtack&apos;s cost guide says most clients pay <strong className="text-fg">$100–$125 per hour</strong>. The low end is $55–$65 and the high end $180–$200 per hour.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Published rate cards reviewed by RealEstatePhotography.com show <strong className="text-fg">$150–$350 for a standard daytime photo package</strong>. Drone photos, video and 3D
              tours are priced as add-ons. The site notes that these are advertised prices, not a national survey.
            </p>
            <p className="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-gray-700">
              <strong className="text-fg">What it means for you:</strong> in the calculator&apos;s real estate example ({realEstateExample.shootHours} hours on site + {realEstateExample.editHours}{" "}
              hours of editing, travel and admin), a {money(REAL_ESTATE_PACKAGE)} package pays {money(REAL_ESTATE_PACKAGE / realEstateHours, true)} per hour of work, and the floor for that
              example is about {money(realEstateFloor)} a shoot. Pricing by square footage keeps your hourly rate steady, because bigger homes take longer to shoot and edit.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Shooting a vacant listing?{" "}
              <Link href="/guides/virtual-staging-cost" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
                See what virtual staging costs in 2026
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-10">
        <h2 className="text-2xl font-bold">Your floor vs. the market</h2>
        <ol className="mt-4 grid gap-4 lg:grid-cols-3">
          <li className="card">
            <p className="font-semibold text-fg">Floor below the market</p>
            <p className="mt-2 text-sm text-gray-600">Price toward the market, not the floor. The floor only tells you where the work stops making you a living.</p>
          </li>
          <li className="card">
            <p className="font-semibold text-fg">Floor above the market</p>
            <p className="mt-2 text-sm text-gray-600">
              The fix is hours: cut editing time per job, book more jobs in the hours you have, or move to work that pays more, such as full-day weddings or larger homes.
            </p>
          </li>
          <li className="card">
            <p className="font-semibold text-fg">Then write it down</p>
            <p className="mt-2 text-sm text-gray-600">
              Put packages, add-ons and policies in one document every client reads the same way.{" "}
              <Link href="/tools/photographer-pricing-guide" className="underline decoration-accent/60 underline-offset-4 hover:text-fg">
                Photographer Pricing Guide
              </Link>{" "}
              builds that branded PDF for $29.
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
          <h3 className="mt-2 text-lg font-bold">Fair housing checker for listing copy</h3>
          <p className="mt-2 text-sm text-gray-600">For the real-estate side of your clients: paste a listing description, see risky phrases and the MLS character count.</p>
          <Link href="/free/fair-housing-checker" className="btn-secondary mt-4">
            Open the checker
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
        <p className="mt-3 text-xs text-gray-500">The calculator&apos;s examples are starting points, not market data. Checked September 2026.</p>
      </section>
    </div>
  );
}
