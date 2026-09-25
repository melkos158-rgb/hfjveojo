import Link from "next/link";
import { formatUsd } from "@/lib/ai/pricing";

export function ToolCard(props: { slug: string; name: string; tagline: string; priceCents: number; category: string; fulfillment: string; deliveryHours: number }) {
  return (
    <Link href={`/tools/${props.slug}`} className="card flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="badge bg-mist text-ink">{props.category.replace("-", " ")}</span>
        <span>{props.fulfillment === "AUTO" ? "Instant" : `${props.deliveryHours}h delivery`}</span>
      </div>
      <h3 className="text-lg font-bold">{props.name}</h3>
      <p className="flex-1 text-sm text-gray-600">{props.tagline}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{formatUsd(props.priceCents)}</span>
        <span className="text-sm font-semibold text-brand">Order →</span>
      </div>
    </Link>
  );
}
