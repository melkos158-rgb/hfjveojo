import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { PricingCalculator } from "@/components/PricingCalculator";

export const metadata: Metadata = {
  title: "Free photography pricing calculator — what to charge per session or wedding",
  description:
    "Enter the income you want, your business costs, tax rate and the hours a job really takes. Get the minimum price per job and per hour, with capacity checks. Free, runs in your browser.",
  keywords: ["photography pricing calculator", "how much to charge for photography", "wedding photography pricing", "photographer hourly rate calculator", "cost of doing business photographer"],
  alternates: { canonical: "/free/photography-pricing-calculator" },
  openGraph: {
    type: "website",
    title: `Free photography pricing calculator | ${site.name}`,
    description: "Minimum price per job and per hour from your income goal, costs, taxes and real hours per job.",
    url: `${site.url}/free/photography-pricing-calculator`,
  },
};

const FAQ = [
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
          </p>
        </div>
      </section>
      <section className="container-x py-10">
        <PricingCalculator />
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
    </div>
  );
}
