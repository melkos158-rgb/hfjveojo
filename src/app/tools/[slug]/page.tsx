import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { liveCatalog } from "@/lib/tools/catalog";
import { IntakeForm } from "@/components/IntakeForm";
import { formatUsd } from "@/lib/ai/pricing";
import { site } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import Image from "next/image";
import { categoryVisual } from "@/lib/tools/visuals";
import { SampleResult } from "@/components/SampleResult";
import { StyleGallery } from "@/components/StyleGallery";
import { isAdmin } from "@/lib/auth/guards";
import { GaViewItem } from "@/components/GaEvents";
import { checkoutMode, secretKeyFor } from "@/lib/stripe/mode";
import { HeroResult } from "@/components/HeroResult";
import { freePhotoAvailability } from "@/lib/orders/free-photo";
import { checkVoucher, DESCRIPTION_TOOL_SLUG } from "@/lib/orders/voucher";
import { checkFinish, FINISH_TOOL_SLUG } from "@/lib/orders/finish";
import { STAGING_FINISH_PACK } from "@/config/staging-pricing";
import { creditBalance, CREDIT_TOOL_SLUG, CREDIT_USE_TOOL_SLUG } from "@/lib/orders/credits";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };
type PageProps = Params & { searchParams: Promise<{ free?: string; voucher?: string; finish?: string }> };

/** Reasons a visitor comes back from the free-photo email link without an order page (see /api/free/claim). */
const FREE_NOTICES = new Set(["used", "expired", "soldout", "invalid", "error"]);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const def = getToolBySlug(slug);
  if (!def) return { title: "Not found" };
  // The layout template appends "| ORVIONIS"; strip a brand suffix from the definition so it is never doubled.
  const brand = site.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const title = def.seo.title.replace(new RegExp(`\\s*[|\u2014-]\\s*${brand}\\s*$`, "i"), "");
  return {
    title,
    description: def.seo.description,
    keywords: def.seo.keywords,
    alternates: { canonical: `/tools/${def.slug}` },
    openGraph: { type: "website", title: `${title} | ${site.name}`, description: def.seo.description, url: `${site.url}/tools/${def.slug}` },
  };
}

export default async function ToolPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { free: freeParam, voucher: voucherParam, finish: finishParam } = await searchParams;
  const def = getToolBySlug(slug);
  if (!def) notFound();
  const item = (await liveCatalog()).find((c) => c.def.id === def.id);
  const session = await getSession();
  const price = item?.priceCents ?? def.pricing.priceCents;
  // Tools priced per unit (virtual staging: per photo) say so everywhere the price is shown.
  const usd = (cents: number) => formatUsd(cents).replace(/\.00$/, "");
  const priceText =
    def.quantity && def.pricing.unit
      ? `${usd(price)} per ${def.pricing.unit.one}${def.pricing.pack ? ` · whole listing ${usd(def.pricing.pack.cents)}` : ""}`
      : `${formatUsd(price)} one-time`;
  const l = def.landing;
  const visual = categoryVisual(def.category);
  // Free first photo: offered only while today's free photos and their share of the AI budget last.
  const freeOffer = Boolean(item && def.freeFirstPhoto && (await freePhotoAvailability()).available);
  const freeNotice = freeParam && FREE_NOTICES.has(freeParam) ? freeParam : null;
  // The MLS description included with a staging Listing Pack: the form takes the voucher instead of a payment.
  const voucherCheck = voucherParam && def.slug === DESCRIPTION_TOOL_SLUG ? await checkVoucher(voucherParam) : null;
  const voucher = voucherCheck ? { token: voucherParam as string, ok: voucherCheck.ok, problem: voucherCheck.ok ? null : voucherCheck.problem } : undefined;
  // "Finish this listing" after a free photo: the finish price, the free photo's style, no second free photo.
  const finishCheck = finishParam && def.slug === FINISH_TOOL_SLUG ? await checkFinish(finishParam) : null;
  const finish = finishCheck ? { token: finishParam as string, ok: finishCheck.ok } : undefined;
  // Pro credits of the signed-in buyer: the staging form offers to use them instead of a checkout.
  const creditsNow = session?.email && def.slug === CREDIT_USE_TOOL_SLUG ? await creditBalance(session.email) : null;
  const credits = creditsNow && creditsNow.rooms > 0 ? { rooms: creditsNow.rooms, validUntil: creditsNow.validUntil?.toISOString().slice(0, 10) ?? null } : undefined;

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
      <GaViewItem tool={{ slug: def.slug, name: def.name }} priceCents={price} currency={item?.currency ?? def.pricing.currency} />

      {l.heroResult ? (
        <section className="bg-mist">
          {/* Mobile: headline, then the real before/after, then the button — the proof is on the first screen. */}
          <div className="container-x grid gap-x-10 gap-y-6 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-[auto_1fr] lg:items-center">
            <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
              <p className="eyebrow">{def.category.replace("-", " ")} · {def.fulfillment === "AUTO" ? "instant" : `${def.sla.deliveryHours}h delivery`}</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{l.headline}</h1>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <HeroResult hero={l.heroResult} />
            </div>
            <div className="flex flex-col lg:col-start-1 lg:row-start-2 lg:self-start">
              <p className="order-2 mt-5 max-w-2xl text-lg text-gray-700 lg:order-1 lg:mt-0">{l.subheadline}</p>
              <div className="order-1 flex flex-wrap items-center gap-x-4 gap-y-3 lg:order-2 lg:mt-6">
                {freeOffer ? (
                  <>
                    <a href="#order" className="btn-primary">
                      Stage your first photo free
                    </a>
                    <span className="text-sm text-gray-600">No card · then {priceText} · {l.deliveryPromise}</span>
                  </>
                ) : (
                  <>
                    <a href="#order" className="btn-primary">
                      {l.ctaLabel}
                    </a>
                    {def.preview ? (
                      <a href="#order" className="btn-secondary">
                        {def.preview.label}
                      </a>
                    ) : null}
                    <span className="text-sm text-gray-600">
                      {priceText} · {l.deliveryPromise}
                    </span>
                  </>
                )}
              </div>
              <dl className="order-3 mt-5 grid max-w-xl gap-2 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-gray-500">You send</dt>
                <dd className="text-fg">{def.io.input}</dd>
                <dt className="text-gray-500">You get</dt>
                <dd className="font-medium text-fg">{def.io.output}</dd>
                <dt className="text-gray-500">Time</dt>
                <dd className="text-fg">{def.io.processingTime}</dd>
              </dl>
              {def.pricing.compareAtText ? <p className="order-4 mt-3 text-xs text-gray-500">{def.pricing.compareAtText}</p> : null}
            </div>
          </div>
        </section>
      ) : (
      <section className="bg-mist">
        <div className={`container-x grid items-center gap-10 py-14 ${visual ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          <div>
            <p className="eyebrow">{def.category.replace("-", " ")} · {def.fulfillment === "AUTO" ? "instant" : `${def.sla.deliveryHours}h delivery`}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{l.headline}</h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-700">{l.subheadline}</p>
            <dl className="mt-5 grid max-w-xl gap-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-gray-500">You send</dt>
              <dd className="text-fg">{def.io.input}</dd>
              <dt className="text-gray-500">You get</dt>
              <dd className="font-medium text-fg">{def.io.output}</dd>
              <dt className="text-gray-500">Time</dt>
              <dd className="text-fg">{def.io.processingTime}</dd>
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a href="#order" className="btn-primary">
                {l.ctaLabel}
              </a>
              {l.sample ? (
                <a href="#example" className="btn-secondary">
                  See an example
                </a>
              ) : null}
              <span className="text-sm text-gray-600">
                {priceText} · {l.deliveryPromise}
              </span>
            </div>
            {def.pricing.compareAtText ? <p className="mt-3 text-xs text-gray-500">{def.pricing.compareAtText}</p> : null}
            {def.preview ? (
              <p className="mt-2 text-sm text-gray-600">
                Not sure? <a href="#order" className="font-semibold text-accent hover:underline">See a free preview on your own photo</a> before you pay.
              </p>
            ) : null}
          </div>
          {visual ? (
            <div className="glow relative overflow-hidden rounded-3xl border border-line bg-card">
              <Image src={visual.webp} alt={visual.alt} width={1200} height={671} priority unoptimized className="h-auto w-full" />
            </div>
          ) : null}
        </div>
      </section>
      )}

      {l.sample ? <SampleResult sample={l.sample} toolName={def.name} /> : null}
      {l.styleGallery ? <StyleGallery gallery={l.styleGallery} /> : null}

      <section className="container-x grid gap-10 py-14 lg:grid-cols-5">
        <div className="space-y-10 lg:col-span-3">
          <div>
            <h2 className="text-xl font-bold">What you get</h2>
            <ul className="mt-4 space-y-2">
              {l.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-gray-700">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
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
            {l.guides?.length ? (
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {l.guides.map((g) => (
                  <a key={g.href} href={g.href} className="font-semibold text-accent hover:underline">
                    {g.label} →
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            {item ? (
              <>
              <IntakeForm
                toolSlug={def.slug}
                fields={def.intake.fields}
                ctaLabel={l.ctaLabel}
                priceLabel={priceText}
                deliveryPromise={l.deliveryPromise}
                initialEmail={session?.email ?? (voucherCheck?.ok ? voucherCheck.email : finishCheck?.ok ? finishCheck.email : undefined)}
                preview={def.preview ? { label: def.preview.label } : undefined}
                adminSandbox={isAdmin(session) && checkoutMode() === "live" && Boolean(secretKeyFor("test"))}
                gaItem={{ name: def.name, priceCents: price, currency: item?.currency ?? def.pricing.currency }}
                perUnit={
                  def.quantity && def.pricing.unit
                    ? {
                        unitCents: price,
                        one: def.pricing.unit.one,
                        many: def.pricing.unit.many,
                        ctaMany: l.ctaLabelMany,
                        tiers: def.pricing.volume,
                        pack: finishCheck?.ok ? STAGING_FINISH_PACK : def.pricing.pack,
                        packIncludes: def.pricing.packIncludes,
                        addon: def.pricing.addon,
                        max: def.intake.fields.find((f) => f.type === "rooms")?.max,
                      }
                    : undefined
                }
                freePhoto={def.freeFirstPhoto ? { available: freeOffer && !finishCheck?.ok && !credits, notice: freeNotice } : undefined}
                voucher={voucher}
                finish={finish}
                credits={credits}
                initialValues={finishCheck?.ok && finishCheck.style ? { style: finishCheck.style } : undefined}
              />
              {def.slug === CREDIT_USE_TOOL_SLUG && !session ? (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Have <a className="underline" href={`/tools/${CREDIT_TOOL_SLUG}`}>Pro credits</a>?{" "}
                  <a className="font-semibold text-accent hover:underline" href={`/login?next=${encodeURIComponent(`/tools/${CREDIT_USE_TOOL_SLUG}#order`)}`}>
                    Sign in to use them
                  </a>
                </p>
              ) : null}
              </>
            ) : (
              <div className="card text-sm text-gray-600">This tool is paused right now. Check back soon or <a className="underline" href="/contact">contact us</a>.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
