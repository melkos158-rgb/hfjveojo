import Image from "next/image";
import Link from "next/link";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard, toolCardProps } from "@/components/ToolCard";
import { categoryInfo } from "@/config/categories";

type Props = {
  category: string;
  eyebrow: string;
  headline: string;
  sub: string;
  pains: string[];
  proofNote?: string;
  /** Optional hero visual from /public (WebP, 1200×671). Rendered next to the headline on large screens. */
  hero?: { src: string; alt: string };
};

/** Shared layout for /real-estate, /photographers, ... — one brand, many verticals, zero custom code per vertical. */
export async function VerticalLanding({ category, eyebrow, headline, sub, pains, proofNote, hero }: Props) {
  const catalog = await liveCatalog(category);
  const first = catalog[0];
  const info = categoryInfo(category);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className={`container-x grid items-center gap-10 py-14 sm:py-20 ${hero ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}`}>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-4xl">{headline}</h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600">{sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {first ? (
                <Link href={`/tools/${first.def.slug}`} className="btn-primary">
                  Order {first.def.name} →
                </Link>
              ) : null}
              <a href="#tools" className="btn-secondary">
                See tools and prices
              </a>
            </div>
          </div>
          {hero ? (
            <div className="glow relative overflow-hidden rounded-3xl border border-line bg-card">
              <Image src={hero.src} alt={hero.alt} width={1200} height={671} priority unoptimized className="h-auto w-full" />
            </div>
          ) : null}
        </div>
      </section>
      <section className="container-x py-14">
        <h2 className="text-2xl font-bold">Sound familiar?</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {pains.map((p) => (
            <li key={p} className="card text-gray-700">
              {p}
            </li>
          ))}
        </ul>
      </section>
      <section id="tools" className="container-x scroll-mt-24 pb-16">
        <h2 className="text-2xl font-bold">What you can order today</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <ToolCard key={c.def.id} {...toolCardProps(c)} />
          ))}
        </div>
        {proofNote ? <p className="mt-6 text-sm text-gray-500">{proofNote}</p> : null}
        {info && info.planned.length ? (
          <div className="mt-10 rounded-2xl border border-line bg-card p-5 sm:p-6">
            <h3 className="font-semibold text-fg">Next results for {info.title.toLowerCase()} — built in the order people ask</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {info.planned.map((l) => (
                <li key={l} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3 py-2 text-sm">
                  <span className="text-gray-700">{l}</span>
                  <Link href={`/contact?topic=${encodeURIComponent(category)}`} className="shrink-0 text-xs font-semibold text-accent hover:underline">
                    I&apos;d pay for this →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {info?.free?.length ? (
          <ul className="mt-6 space-y-2">
            {info.free.map((f) => (
              <li key={f.href} className="text-sm text-gray-600">
                <span className="badge mr-2 bg-green-50 text-green-700">Free</span>
                <Link href={f.href} className="font-semibold text-accent hover:underline">
                  {f.label} →
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-6 text-sm text-gray-600">
          Need something that is not listed? <Link className="underline" href={`/contact?topic=${encodeURIComponent(category)}`}>Tell us</Link> — the next tool gets built for the job people actually pay for.
        </p>
      </section>
    </div>
  );
}
