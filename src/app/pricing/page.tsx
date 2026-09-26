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
              <th className="px-4 py-3">Result</th>
              <th className="hidden px-4 py-3 md:table-cell">You provide</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((c) => (
              <tr key={c.def.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/tools/${c.def.slug}`} className="font-semibold hover:text-accent">
                    {c.def.name}
                  </Link>
                  <div className="text-xs text-gray-500">{c.def.io.output}</div>
                </td>
                <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{c.def.io.input}</td>
                <td className="px-4 py-3 text-gray-600">{c.def.io.processingTime}</td>
                <td className="px-4 py-3 text-right font-bold">{formatUsd(c.priceCents).replace(/\.00$/, "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
