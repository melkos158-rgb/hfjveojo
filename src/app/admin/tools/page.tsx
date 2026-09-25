import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/admin/Kpi";
import { formatUsd } from "@/lib/ai/pricing";
import { setProductPriceAction, setToolStatusAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminTools() {
  const tools = await prisma.tool.findMany({ include: { products: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Tools & prices</h1>
      <p className="mt-1 text-sm text-gray-600">
        Status controls whether a tool can be ordered (LIVE, VALIDATING) or is hidden (PAUSED, DRAFT, DEPRECATED). Prices changed here are locked against code defaults.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {tools.map((t) => (
          <div key={t.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-gray-500">
                  {t.id} · v{t.version} · {t.fulfillment} · {t._count.orders} orders
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <form action={setToolStatusAction} className="flex gap-2">
              <input type="hidden" name="toolId" value={t.id} />
              <select name="status" defaultValue={t.status} className="field-input w-auto">
                {["DRAFT", "VALIDATING", "LIVE", "PAUSED", "DEPRECATED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn-secondary px-4 py-2" type="submit">
                Set status
              </button>
            </form>
            {t.products.map((p) => (
              <form key={p.id} action={setProductPriceAction} className="flex items-center gap-2 text-sm">
                <input type="hidden" name="productId" value={p.id} />
                <span className="w-40 truncate">{p.sku}</span>
                <span className="font-semibold">{formatUsd(p.priceCents)}</span>
                <input name="priceCents" className="field-input w-28" placeholder="cents" defaultValue={p.priceCents} />
                <button className="btn-secondary px-3 py-1.5" type="submit">
                  Update price
                </button>
              </form>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
