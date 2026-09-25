import type { Metadata } from "next";
import Link from "next/link";
import { liveCatalog } from "@/lib/tools/catalog";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple per-result pricing. No subscription. See every tool's price and delivery time.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const catalog = await liveCatalog();
  return (
    <div className="container-x py-12">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Every tool has one fixed price and a delivery promise. You pay when you order; you get a refund if we can&apos;t deliver
        what the page promised (see the <Link className="underline" href="/refund-policy">refund policy</Link>). Bundles and
        monthly plans will be offered once enough customers ask for them — not before.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Tool</th>
              <th className="px-4 py-3">For</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((c) => (
              <tr key={c.def.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/tools/${c.def.slug}`} className="hover:underline">
                    {c.def.name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{c.def.category.replace("-", " ")}</td>
                <td className="px-4 py-3 text-gray-600">{c.def.landing.deliveryPromise}</td>
                <td className="px-4 py-3 text-right font-bold">{formatUsd(c.priceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
