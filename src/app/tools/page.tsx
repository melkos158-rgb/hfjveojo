import type { Metadata } from "next";
import { liveCatalog } from "@/lib/tools/catalog";
import { ToolCard, toolCardProps } from "@/components/ToolCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All tools: AI virtual staging, listing descriptions and more",
  description:
    "Four done-for-you tools, each with one fixed price: virtual staging $15 per photo (first photo free), listing descriptions $9, listing clips $49 and photographer pricing guides $29. See what goes in, what comes out and the delivery time before you pay.",
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
                <ToolCard key={c.def.id} {...toolCardProps(c)} />
              ))}
          </div>
        </section>
      ))}
      {catalog.length === 0 ? <p className="mt-10 text-gray-500">No tools are live yet. Run `npm run db:seed`.</p> : null}
    </div>
  );
}
