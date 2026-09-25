import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard } from "@/components/ToolCard";

export const dynamic = "force-dynamic";

/** Home hero photo. Swap the file in /public/img to change it; keep 3:2. */
const HOME_HERO = { src: "/img/hero-home.webp", alt: "A modern house at dusk with warm light in the windows and a still pool in front" };

/** Facts only — every line here is a real product promise, not a vanity metric. */
const trustRow = [
  { k: "48 hours", v: "Listing clips delivered, edited by a human" },
  { k: "Minutes", v: "Pricing guide PDF generated from your packages" },
  { k: "$29–$49", v: "Per result. No subscription, ever" },
  { k: "Stripe", v: "Secure checkout, receipt and refund policy" },
];

const verticalCards = [
  {
    href: "/real-estate",
    image: "/img/hero-real-estate.webp",
    alt: "A phone on a tripod filming a bright, staged living room for a listing walkthrough",
    eyebrow: "Real-estate agents",
    title: "Listing clips from your walkthrough video",
    blurb: "Five vertical clips with price, beds/baths and your branding — captions included, delivered in 48 hours.",
    cta: "See how it works",
  },
  {
    href: "/photographers",
    image: "/img/hero-photographers.webp",
    alt: "A printed photography pricing guide open on a desk next to a camera",
    eyebrow: "Photographers",
    title: "A branded pricing guide from your real packages",
    blurb: "Answer ten questions, get a polished PDF in your voice and colors — ready to send to the next enquiry.",
    cta: "See how it works",
  },
];

export default async function HomePage() {
  const catalog = await liveCatalog();
  return (
    <div>
      <section className="bg-white">
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="eyebrow mb-4">Done-for-you, priced per result</p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Premium visuals. Real results.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">{site.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/real-estate" className="btn-primary">
                I&apos;m a real-estate agent
              </Link>
              <Link href="/photographers" className="btn-secondary">
                I&apos;m a photographer
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl shadow-[0_30px_80px_-30px_rgba(11,11,12,0.35)] ring-1 ring-line">
            <Image src={HOME_HERO.src} alt={HOME_HERO.alt} width={1024} height={688} priority unoptimized className="h-auto w-full" />
          </div>
        </div>
        <div className="container-x pb-12">
          <dl className="grid gap-4 border-t border-line pt-8 sm:grid-cols-4">
            {trustRow.map((t) => (
              <div key={t.k} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                <div>
                  <dt className="text-base font-bold text-ink">{t.k}</dt>
                  <dd className="text-sm text-gray-600">{t.v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x py-16">
        <h2 className="text-2xl font-bold">Who is this for?</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {verticalCards.map((v) => (
            <Link key={v.href} href={v.href} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-mist">
                <Image src={v.image} alt={v.alt} fill sizes="(min-width: 640px) 50vw, 100vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-5">
                <div className="eyebrow">{v.eyebrow}</div>
                <h3 className="mt-1 text-lg font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{v.blurb}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-brand">{v.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tools you can order right now</h2>
            <p className="mt-1 text-gray-600">No subscription. Pay once, get the deliverable, keep the files.</p>
          </div>
          <Link href="/tools" className="text-sm font-semibold text-brand">
            See all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <ToolCard
              key={c.def.id}
              slug={c.def.slug}
              name={c.def.name}
              tagline={c.def.tagline}
              priceCents={c.priceCents}
              category={c.def.category}
              fulfillment={c.def.fulfillment}
              deliveryHours={c.def.sla.deliveryHours}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-mist">
        <div className="container-x grid gap-8 py-16 sm:grid-cols-3">
          {[
            { t: "Before", d: "A raw walkthrough on your phone. A price list in your head. An enquiry waiting for a reply." },
            { t: site.name, d: "You answer a short form and pay once. AI drafts, a human checks where it matters, and quality gates run before anything ships." },
            { t: "After", d: "Clips ready to post. A branded PDF ready to send. Files you own — delivered to your inbox and your order page." },
          ].map((s) => (
            <div key={s.t} className="card">
              <div className="eyebrow">{s.t}</div>
              <p className="mt-2 text-gray-700">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            ["Pick a tool", "Each tool solves one specific job for one profession. You see the price and delivery time up front."],
            ["Fill in the form", "Only what the deliverable needs. Links instead of uploads where possible. Two to five minutes."],
            ["Pay and receive", "Stripe checkout. Instant tools deliver in minutes; concierge tools within the promised window. One revision included."],
          ].map(([t, d], i) => (
            <li key={t} className="card">
              <div className="eyebrow mb-2">Step {i + 1}</div>
              <div className="font-semibold">{t}</div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
