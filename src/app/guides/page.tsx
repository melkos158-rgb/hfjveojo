import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { GUIDES } from "@/config/guides";

export const metadata: Metadata = {
  title: "Guides for agents and photographers",
  description: "Practical, sourced guides: fair-housing wording, California's AB 723 rules for staged photos, and how to shoot rooms that stage well.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/guides/${g.slug}`, name: g.title })),
  };
  return (
    <div className="container-x max-w-4xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <p className="eyebrow">Guides</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Do it right the first time</h1>
      <p className="mt-3 max-w-2xl text-gray-600">Short, sourced guides for the jobs our tools do. General information, not legal advice.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug} className="card flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{g.audience}</p>
            <h2 className="text-lg font-bold">
              <Link href={`/guides/${g.slug}`} className="hover:text-accent">
                {g.title}
              </Link>
            </h2>
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
        ))}
      </ul>
    </div>
  );
}
