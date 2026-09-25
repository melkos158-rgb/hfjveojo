import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard, toolCardProps } from "@/components/ToolCard";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

/** Home hero photo. Swap the file in /public/img to change it; keep 3:2. */
const HOME_HERO = { src: "/img/hero-home.webp", alt: "A modern house at dusk with warm light in the windows and a still pool in front" };

/** The one thing a visitor must understand in the first seconds. */
const FLOW = [
  { n: "1", t: "Your input", d: "A video link, a few facts, your price list" },
  { n: "2", t: "We do the work", d: "Drafted, checked, edited where a human is needed" },
  { n: "3", t: "Finished result", d: "Clips, a PDF, copy — ready to use" },
  { n: "4", t: "Pay once", d: "Stripe checkout, fixed price, no subscription" },
  { n: "5", t: "Download", d: "Inbox + your order page, files kept 90 days" },
];

/**
 * Categories: what is live today and what we are lining up next. "Planned" items link to the contact form so
 * demand is measured before anything is built — no fake "coming soon" launches.
 */
const CATEGORIES = [
  {
    href: "/real-estate",
    image: "/img/hero-real-estate.webp",
    alt: "A phone on a tripod filming a bright, staged living room for a listing walkthrough",
    title: "Real estate",
    live: ["Raw walkthrough → 5 listing clips"],
    planned: ["Room photos → virtual staging", "Listing facts → listing description", "Listing files → marketing package"],
    cta: "See real-estate tools",
  },
  {
    href: "/photographers",
    image: "/img/hero-photographers.webp",
    alt: "A printed photography pricing guide open on a desk next to a camera",
    title: "Photographers",
    live: ["Packages + prices → branded pricing guide (PDF)"],
    planned: ["Your process → client welcome guide", "Business facts → branded documents", "Raw content → social posts"],
    cta: "See photographer tools",
  },
  {
    href: "/contact?topic=contractors",
    image: null,
    alt: "",
    title: "Contractors",
    live: [],
    planned: ["Voice note + photos → proposal", "Job facts → estimate", "Photos → job documentation"],
    cta: "Tell us what you need",
  },
];

const FAQ = [
  { q: "What do I actually upload?", a: "As little as possible. For listing clips: a link to your walkthrough video plus the listing facts. For the pricing guide: your packages, prices and a few sentences about you. No accounts, no uploads of large files — links are fine." },
  { q: "How fast is it?", a: "The pricing guide is generated in about five minutes and lands in your inbox. Listing clips are edited by a person and delivered within 48 hours." },
  { q: "What if I do not like the result?", a: "Every order includes one revision. If we cannot get it right, our refund policy applies — no arguing over a $29–$49 order." },
  { q: "Do you use AI?", a: "Yes, for drafting and layout, with fixed checks after it (prices copied exactly, no invented facts, fair-housing wording) and a human editor on video work. You pay for the finished result, not for access to a model." },
  { q: "How do I pay?", a: "By card through Stripe Checkout. You get a Stripe receipt and an order page with the files. No subscription — you order again only when you have the next listing or enquiry." },
  { q: "Who owns the files?", a: "You do. Download them from your order page for 90 days; we do not resell or publish your material." },
];

export default async function HomePage() {
  const catalog = await liveCatalog();
  const featured = catalog.filter((c) => c.def.featured).concat(catalog.filter((c) => !c.def.featured)).slice(0, 6);
  const fromPrice = catalog.length ? Math.min(...catalog.map((c) => c.priceCents)) : 2900;
  const from = formatUsd(fromPrice).replace(/\.00$/, "");
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">Done-for-you · priced per result</p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl">
              Upload what you have. Get the <span className="text-gradient">finished result.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">
              A walkthrough video becomes five listing clips. Your package list becomes a branded pricing guide. Fixed price from{" "}
              <span className="font-semibold text-fg">{from}</span>, most results in minutes, video edits in 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tools" className="btn-primary">
                Browse tools
              </Link>
              <a href="#how" className="btn-secondary">
                See how it works
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              {["No subscription", "One revision included", "Stripe checkout"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="glow relative">
            <div className="overflow-hidden rounded-3xl border border-line bg-card">
              <Image src={HOME_HERO.src} alt={HOME_HERO.alt} width={1024} height={688} priority unoptimized className="h-auto w-full" />
            </div>
            <div className="absolute -bottom-4 left-4 rounded-xl border border-line bg-card/95 px-4 py-3 text-sm shadow-xl backdrop-blur sm:left-6">
              <div className="text-xs text-gray-500">Finished result</div>
              <div className="font-semibold text-fg">Delivered to your inbox + order page</div>
            </div>
          </div>
        </div>

        {/* THE FLOW */}
        <div className="container-x pb-14">
          <ol className="grid gap-3 rounded-2xl border border-line bg-card p-3 sm:grid-cols-5 sm:gap-0 sm:p-0">
            {FLOW.map((s, i) => (
              <li key={s.n} className="relative flex items-start gap-3 rounded-xl p-3 sm:flex-col sm:gap-2 sm:p-5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 2 ? "bg-brand text-white" : "bg-gray-100 text-gray-700"}`}>{s.n}</span>
                <div>
                  <div className="font-semibold text-fg">{s.t}</div>
                  <div className="text-sm text-gray-500">{s.d}</div>
                </div>
                {i < FLOW.length - 1 ? <span className="absolute top-1/2 right-2 hidden -translate-y-1/2 text-gray-400 sm:block">→</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-y border-line bg-mist">
        <div className="container-x py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Before → after</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">See the result before you pay</h2>
            </div>
            <p className="max-w-md text-sm text-gray-500">Example layouts built from sample data. Your order uses your listing facts, your packages and your brand color.</p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Listing clips */}
            <div className="card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-fg">Listing Clips</h3>
                <span className="badge bg-gray-100 text-gray-700">Example</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                <div>
                  <div className="mb-2 text-xs tracking-wider text-gray-500 uppercase">Before · your walkthrough</div>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <Image src="/img/hero-real-estate.webp" alt="Raw walkthrough filmed on a phone" width={1200} height={671} unoptimized className="h-auto w-full" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Raw phone video, one long take</div>
                </div>
                <div className="self-center text-2xl text-brand">→</div>
                <div>
                  <div className="mb-2 text-xs tracking-wider text-gray-500 uppercase">After · 5 vertical clips</div>
                  <div className="mx-auto w-[62%] min-w-[120px] overflow-hidden rounded-2xl border border-line bg-black">
                    <div className="relative aspect-[9/16]">
                      <Image src="/img/hero-real-estate.webp" alt="Vertical listing clip with price and stats overlay" fill unoptimized className="object-cover" sizes="200px" />
                      <div className="absolute inset-x-0 top-0 p-2">
                        <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">$549,000 · 3bd · 2.5ba</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] leading-tight text-white">
                        Renovated kitchen · open house Sun 2–4
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-500">Price, stats, captions, your branding</div>
                </div>
              </div>
            </div>

            {/* Pricing guide */}
            <div className="card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-fg">Photographer Pricing Guide</h3>
                <span className="badge bg-gray-100 text-gray-700">Example</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                <div>
                  <div className="mb-2 text-xs tracking-wider text-gray-500 uppercase">Before · your packages</div>
                  <pre className="overflow-hidden rounded-xl border border-line bg-bg p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-gray-700">
                    {"The Essentials | $2,400 | 6 hours, 400+ edited photos\nThe Full Day | $3,800 | 10 hours, second shooter\nBrand color: #8a6d3b · voice: warm"}
                  </pre>
                  <div className="mt-2 text-xs text-gray-500">Ten short questions, no design work</div>
                </div>
                <div className="self-center text-2xl text-brand">→</div>
                <div>
                  <div className="mb-2 text-xs tracking-wider text-gray-500 uppercase">After · branded PDF</div>
                  <div className="overflow-hidden rounded-xl border border-line bg-white text-[10px] leading-snug text-neutral-800 shadow">
                    <div className="h-2" style={{ background: "#8a6d3b" }} />
                    <div className="p-3">
                      <div className="text-[8px] tracking-[0.2em] text-neutral-500 uppercase">Ember &amp; Oak Photography</div>
                      <div className="mt-1 text-sm font-bold text-neutral-900">Wedding collections 2026</div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          ["The Essentials", "6 hours · 400+ photos", "$2,400"],
                          ["The Full Day", "10 hours · second shooter", "$3,800"],
                        ].map(([n, d, p]) => (
                          <div key={n} className="rounded border border-neutral-200 p-2">
                            <div className="font-semibold">{n}</div>
                            <div className="text-neutral-500">{d}</div>
                            <div className="mt-1 font-bold" style={{ color: "#8a6d3b" }}>
                              {p}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-[8px] text-neutral-500">Cover · About · Packages · Add-ons · Process · FAQ · Policies</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-500">5 pages, your prices copied exactly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section id="tools" className="container-x scroll-mt-24 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tools</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Order a result, not a subscription</h2>
            <p className="mt-2 text-gray-600">Each tool does one job. You see what goes in, what comes out, the time and the price before you pay.</p>
          </div>
          <Link href="/tools" className="hidden text-sm font-semibold text-accent sm:inline">
            All tools →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <ToolCard key={c.def.id} {...toolCardProps(c)} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-line bg-mist">
        <div className="container-x py-16">
          <p className="eyebrow">Who it is for</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Built for people who sell with visuals and documents</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.title} className="card flex flex-col overflow-hidden p-0">
                {c.image ? (
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <Image src={c.image} alt={c.alt} fill sizes="(min-width: 768px) 33vw, 100vw" unoptimized className="object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-gray-100 px-6 text-center text-sm text-gray-500">Next category — shaped by what people ask for</div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-fg">{c.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {c.live.map((l) => (
                      <li key={l} className="flex items-start gap-2 text-fg">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" /> {l}
                      </li>
                    ))}
                    {c.planned.map((l) => (
                      <li key={l} className="flex items-start gap-2 text-gray-500">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                        <span>
                          {l} <span className="badge ml-1 bg-gray-100 text-gray-500">planned</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href={c.href} className="btn-secondary mt-5">
                    {c.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Planned tools are built in the order people ask for them — the contact form is the vote.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container-x scroll-mt-24 py-16">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Four steps, no meetings</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pick a tool", "One job each. Price and delivery time are on the card."],
            ["Fill in the short form", "Only what the result needs. Links instead of uploads where possible — two to five minutes."],
            ["Pay once", "Stripe Checkout. You get a receipt and an order page immediately."],
            ["Get the result", "Instant tools deliver in minutes; edited video within 48 hours. Files by email and on your order page."],
          ].map(([t, d], i) => (
            <li key={t} className="card">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">{i + 1}</div>
              <div className="font-semibold text-fg">{t}</div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section className="border-y border-line bg-mist">
        <div className="container-x py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Fixed price per result</h2>
            </div>
            <Link href="/pricing" className="text-sm font-semibold text-accent">
              Full pricing →
            </Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Result</th>
                  <th className="hidden px-4 py-3 sm:table-cell">You provide</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((c) => (
                  <tr key={c.def.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/tools/${c.def.slug}`} className="font-semibold text-fg hover:text-accent">
                        {c.def.io.output}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{c.def.io.input}</td>
                    <td className="px-4 py-3 text-gray-600">{c.def.io.processingTime}</td>
                    <td className="px-4 py-3 text-right font-bold text-fg">{formatUsd(c.priceCents).replace(/\.00$/, "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">Prices in USD. One revision included. No subscription, no minimums.</p>
        </div>
      </section>

      {/* TRUST */}
      <section className="container-x py-16">
        <p className="eyebrow">Why it is safe to try</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Small orders, clear rules</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Stripe Checkout", "Card payments handled by Stripe. We never see your card number."],
            ["Refund policy", "One revision included; if the result is unusable, the refund policy applies."],
            ["Checked before it ships", "Prices are copied exactly, no invented facts, and video edits are done by a person."],
            ["Your files", "Download from your order page for 90 days. We do not publish or resell your material."],
          ].map(([t, d]) => (
            <div key={t} className="card">
              <div className="font-semibold text-fg">{t}</div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          We are new and small. There are no testimonials on this page yet — the first ones will be real, with names. Read the{" "}
          <Link href="/refund-policy" className="underline">
            refund policy
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="border-y border-line bg-mist">
        <div className="container-x py-16">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Questions people ask before ordering</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQ.map((f) => (
              <details key={f.q} className="card group">
                <summary className="cursor-pointer list-none font-semibold text-fg">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-gray-500 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-x py-20">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Send us what you have.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-gray-600">Pick the result you need, fill in the short form, pay once. The finished files come back to your inbox.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/real-estate" className="btn-primary">
              I&apos;m a real-estate agent
            </Link>
            <Link href="/photographers" className="btn-secondary">
              I&apos;m a photographer
            </Link>
          </div>
          <p className="relative mt-4 text-xs text-gray-500">
            {site.name} · from {from} per result
          </p>
        </div>
      </section>
    </div>
  );
}
