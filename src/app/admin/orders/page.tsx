import Link from "next/link";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";
import { StatusBadge, fmtDate } from "@/components/admin/Kpi";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "REVIEW", "COMPLETED", "FAILED", "RETRYING", "REFUNDED", "CANCELED"];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const where = {
    ...(status && STATUSES.includes(status as OrderStatus) ? { status: status as OrderStatus } : {}),
    ...(q ? { OR: [{ customerEmail: { contains: q, mode: "insensitive" as const } }, { id: q }] } : {}),
  };
  const orders = await prisma.order.findMany({ where, include: { tool: true }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link href="/admin/orders/new" className="btn-secondary px-4 py-2 text-sm">
          + External order (Fiverr, Upwork, direct)
        </Link>
      </div>
      <form className="mt-4 flex flex-wrap gap-2 text-sm">
        <select name="status" defaultValue={status ?? ""} className="field-input w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={q ?? ""} placeholder="email or order id" className="field-input w-64" />
        <button className="btn-secondary px-4 py-2" type="submit">
          Filter
        </button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Tool</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const attr = (o.attribution ?? {}) as Record<string, string>;
              return (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                      #{o.number}
                      {o.isTest ? <span className="badge ml-2 bg-amber-50 text-amber-700">TEST</span> : null}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{o.customerEmail}</td>
                  <td className="px-3 py-2">{o.tool.name}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-2">{formatUsd(o.amountCents)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(o.createdAt)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(o.dueAt)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{attr.utm_source || attr.ref || attr.referrer || "direct"}</td>
                </tr>
              );
            })}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No orders match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
