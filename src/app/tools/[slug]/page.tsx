import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { liveCatalog } from "@/lib/tools/catalog";
import { IntakeForm } from "@/components/IntakeForm";
import { formatUsd } from "@/lib/ai/pricing";
import { site } from "@/config/site";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const def = getToolBySlug(slug);
  if (!def) return { title: "Not found" };
  return {
    title: def.seo.title,
    description: def.seo.description,
    keywords: def.seo.keywords,
    alternates: { canonical: `/tools/${def.slug}` },
    openGraph: { title: def.seo.title, description: def.seo.description, url: `${site.url}/tools/${def.slug}` },
  };
}

export default async function ToolPage({ params }: Params) {
  const { slug } = await params;
  const def = getToolBySlug(slug);
  if (!def) notFound();
  const item = (await liveCatalog()).find((c) => c.def.id === def.id);
  const session = await getSession();
  const price = item?.priceCents ?? def.pricing.priceCents;
  const l = def.landing;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: def.name,
    description: def.seo.description,
    brand: { "@type": "Brand", name: site.name },
    offers: { "@type": "Offer", price: (price / 100).toFixed(2), priceCurrency: (item?.currency ?? def.pricing.currency).toUpperCase(), availability: item ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site.url}/tools/${def.slug}` },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: l.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="bg-mist">
        <div className="container-x py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">{def.category.replace("-", " ")} · {def.fulfillment === "AUTO" ? "instant" : `${def.sla.deliveryHours}h delivery`}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold sm:text-4xl">{l.headline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">{l.subheadline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href="#order" className="btn-primary">
              {l.ctaLabel}
            </a>
            <span className="text-sm text-gray-600">
              {formatUsd(price)} one-time · {l.deliveryPromise}
            </span>
          </div>
          {def.pricing.compareAtText ? <p className="mt-3 text-xs text-gray-500">{def.pricing.compareAtText}</p> : null}
        </div>
      </section>

      <section className="container-x grid gap-10 py-14 lg:grid-cols-5">
        <div className="space-y-10 lg:col-span-3">
          <div>
            <h2 className="text-xl font-bold">What you get</h2>
            <ul className="mt-4 space-y-2">
              {l.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-gray-700">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">How it works</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {l.howItWorks.map((s) => (
                <div key={s.title} className="card">
                  <div className="font-semibold">{s.title}</div>
                  <p className="mt-1 text-sm text-gray-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          {l.guarantee ? (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-ink">
              <span className="font-semibold">Guarantee: </span>
              {l.guarantee}
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-bold">Questions</h2>
            <dl className="mt-4 space-y-4">
              {l.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1 text-sm text-gray-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            {item ? (
              <IntakeForm
                toolSlug={def.slug}
                fields={def.intake.fields}
                ctaLabel={l.ctaLabel}
                priceLabel={`${formatUsd(price)} one-time`}
                deliveryPromise={l.deliveryPromise}
                initialEmail={session?.email}
              />
            ) : (
              <div className="card text-sm text-gray-600">This tool is paused right now. Check back soon or <a className="underline" href="/contact">contact us</a>.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
