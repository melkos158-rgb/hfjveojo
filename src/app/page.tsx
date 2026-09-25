import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard } from "@/components/ToolCard";

export const dynamic = "force-dynamic";

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
      <section className="bg-ink text-white">
        <div className="container-x py-20 sm:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Done-for-you, priced per result</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Send us what you have. Get the finished thing back — in hours.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/real-estate" className="btn-primary">
              I&apos;m a real-estate agent
            </Link>
            <Link href="/photographers" className="btn bg-white text-ink hover:bg-gray-100">
              I&apos;m a photographer
            </Link>
          </div>
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
                <div className="text-xs font-semibold uppercase tracking-widest text-brand">{v.eyebrow}</div>
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
              <div className="text-xs font-semibold uppercase tracking-widest text-brand">{s.t}</div>
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
              <div className="mb-2 text-sm font-bold text-brand">Step {i + 1}</div>
              <div className="font-semibold">{t}</div>
              <p className="mt-1 text-sm text-gray-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
