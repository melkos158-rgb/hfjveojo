import type { Metadata } from "next";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard } from "@/components/ToolCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All tools",
  description: "Every deliverable you can order: listing clips for real-estate agents, pricing guides for photographers, and more. Pay per result.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsPage() {
  const catalog = await liveCatalog();
  const categories = [...new Set(catalog.map((c) => c.def.category))];
  return (
    <div className="container-x py-12">
      <h1 className="text-3xl font-bold">All tools</h1>
      <p className="mt-2 text-gray-600">One job each. Fixed price. Delivery time shown before you pay.</p>
      {categories.map((cat) => (
        <section key={cat} className="mt-10">
          <h2 className="mb-4 text-xl font-semibold capitalize">{cat.replace("-", " ")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalog
              .filter((c) => c.def.category === cat)
              .map((c) => (
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
      ))}
      {catalog.length === 0 ? <p className="mt-10 text-gray-500">No tools are live yet. Run `npm run db:seed`.</p> : null}
    </div>
  );
}
