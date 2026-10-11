import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { GUIDES, GUIDE_TOPICS, type Guide } from "@/config/guides";

export const metadata: Metadata = {
  title: "Guides for agents and photographers",
  description:
    "Sourced guides for agents and photographers: virtual staging disclosure and MLS rules (AB 723, Stellar, ARMLS), costs and pricing, and photos that stage well.",
  alternates: { canonical: "/guides" },
};

function GuideCard({ g }: { g: Guide }) {
  return (
    <li className="card flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{g.audience}</p>
      <h3 className="text-lg font-bold">
        <Link href={`/guides/${g.slug}`} className="hover:text-accent">
          {g.title}
        </Link>
      </h3>
      <p className="text-sm text-gray-600">{g.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-2 text-sm">
        <Link href={`/guides/${g.slug}`} className="font-semibold text-accent hover:underline">
          Read the guide →
        </Link>
        {g.tool ? (
          <Link href={`/tools/${g.tool.slug}`} className="text-gray-600 hover:text-ink">
            {g.tool.label}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

/** The hub groups guides by topic (src/config/guides.ts); a guide whose topic has no section still shows, under "More guides". */
export default function GuidesIndex() {
  const sections = GUIDE_TOPICS.map((t) => ({ ...t, guides: GUIDES.filter((g) => g.topic === t.key) })).filter((t) => t.guides.length > 0);
  const listed = new Set(sections.flatMap((t) => t.guides.map((g) => g.slug)));
  const rest = GUIDES.filter((g) => !listed.has(g.slug));
  const ordered = [...sections.flatMap((t) => t.guides), ...rest];
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ordered.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/guides/${g.slug}`, name: g.title })),
  };
  return (
    <div className="container-x max-w-4xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <p className="eyebrow">Guides</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Do it right the first time</h1>
      <p className="mt-3 max-w-2xl text-gray-600">Short, sourced guides for the jobs our tools do. General information, not legal advice.</p>
      {sections.map((t) => (
        <section key={t.key} className="mt-10">
          <h2 className="text-xl font-bold">{t.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.intro}</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {t.guides.map((g) => (
              <GuideCard key={g.slug} g={g} />
            ))}
          </ul>
        </section>
      ))}
      {rest.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">More guides</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {rest.map((g) => (
              <GuideCard key={g.slug} g={g} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
