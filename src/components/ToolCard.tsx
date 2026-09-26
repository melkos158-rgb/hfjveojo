import Link from "next/link";
import { formatUsd } from "@/lib/ai/pricing";
import type { CatalogItem } from "@/lib/tools/catalog";

export type ToolCardProps = {
  slug: string;
  name: string;
  priceCents: number;
  category: string;
  io: CatalogItem["def"]["io"];
  featured?: boolean;
  /** Per-unit pricing (e.g. "photo"): the price is shown as "$15 / photo". */
  unit?: string;
};

/** Map a catalog row to card props (one place to change when the card grows). */
export function toolCardProps(c: CatalogItem): ToolCardProps {
  return {
    slug: c.def.slug,
    name: c.def.name,
    priceCents: c.priceCents,
    category: c.def.category,
    io: c.def.io,
    featured: c.def.featured,
    unit: c.def.quantity ? c.def.pricing.unit?.one : undefined,
  };
}

function categoryLabel(c: string): string {
  return c.replace("-", " ");
}

/**
 * One tool = one concrete result. The card answers, in order: what you hand over, what you get back,
 * how long it takes, what it costs — then one button. No abstract "AI-powered" copy.
 */
export function ToolCard(props: ToolCardProps) {
  const price = formatUsd(props.priceCents).replace(/\.00$/, "");
  return (
    <div className={`card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:border-brand/50 ${props.featured ? "ring-1 ring-brand/30" : ""}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="badge bg-gray-100 text-gray-700 capitalize">{categoryLabel(props.category)}</span>
        <span>{props.io.processingTime}</span>
      </div>
      <h3 className="text-lg font-bold text-fg">{props.name}</h3>
      <dl className="grid gap-2 text-sm">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-gray-500">Upload</dt>
          <dd className="text-gray-700">{props.io.input}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-gray-500">Get</dt>
          <dd className="font-medium text-fg">{props.io.output}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <div>
          <div className="text-xs text-gray-500">From</div>
          <div className="text-xl font-bold text-fg">
            {price}
            {props.unit ? <span className="text-sm font-medium text-gray-500"> / {props.unit}</span> : null}
          </div>
        </div>
        <Link href={`/tools/${props.slug}`} className={props.featured ? "btn-primary" : "btn-secondary"}>
          {props.io.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
