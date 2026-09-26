import Link from "next/link";
import { allTools, getToolBySlug } from "@/lib/tools/registry";
import { requireAdminPage } from "@/lib/auth/guards";
import { ExternalOrderForm } from "@/components/admin/ExternalOrderForm";

export const dynamic = "force-dynamic";

/** Record an order paid on Fiverr, Upwork, Etsy or in a direct deal, and run it through the pipeline. */
export default async function NewExternalOrderPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  const admin = await requireAdminPage("/admin/orders/new");
  const { tool } = await searchParams;
  const def = tool ? getToolBySlug(tool) : undefined;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">New external order</h1>
        <p className="text-sm text-gray-600">For sales made on a marketplace or paid outside Stripe. Pick the tool, fill in what the buyer sent, and the order runs like a website order. The files are emailed to you and stay on the order page.</p>
        <ul className="space-y-1 text-sm">
          {allTools()
            .filter((t) => t.active !== false)
            .map((t) => (
              <li key={t.slug}>
                <Link href={`/admin/orders/new?tool=${t.slug}`} className={`block rounded-md px-3 py-2 hover:bg-mist ${t.slug === def?.slug ? "bg-mist font-semibold text-ink" : "text-gray-700"}`}>
                  {t.name} {t.fulfillment !== "AUTO" ? <span className="text-xs text-gray-500">(concierge)</span> : null}
                </Link>
              </li>
            ))}
        </ul>
      </div>
      <div className="lg:col-span-2">
        {def ? (
          <ExternalOrderForm toolSlug={def.slug} toolName={def.name} fields={def.intake.fields} defaultEmail={admin.email} unitCents={def.pricing.priceCents} />
        ) : (
          <div className="card text-sm text-gray-600">Choose a tool on the left.</div>
        )}
      </div>
    </div>
  );
}
