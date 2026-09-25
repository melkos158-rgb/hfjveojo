import Link from "next/link";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard } from "@/components/ToolCard";

type Props = {
  category: string;
  eyebrow: string;
  headline: string;
  sub: string;
  pains: string[];
  proofNote?: string;
};

/** Shared layout for /real-estate, /photographers, ... — one brand, many verticals, zero custom code per vertical. */
export async function VerticalLanding({ category, eyebrow, headline, sub, pains, proofNote }: Props) {
  const catalog = await liveCatalog(category);
  return (
    <div>
      <section className="bg-ink text-white">
        <div className="container-x py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight">{headline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-300">{sub}</p>
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
      <section className="container-x pb-16">
        <h2 className="text-2xl font-bold">What you can order today</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        {proofNote ? <p className="mt-6 text-sm text-gray-500">{proofNote}</p> : null}
        <p className="mt-6 text-sm text-gray-600">
          Need something that is not listed? <Link className="underline" href="/contact">Tell us</Link> — the next tool gets built for the job people actually pay for.
        </p>
      </section>
    </div>
  );
}
