import { prisma } from "@/lib/db";
import { fmtDate } from "@/components/admin/Kpi";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { orders: { where: { status: { in: ["PAID", "PROCESSING", "REVIEW", "COMPLETED"] } }, select: { amountCents: true } } },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Paid orders</th>
              <th className="px-3 py-2">Lifetime value</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 text-xs">{u.role}</td>
                <td className="px-3 py-2">{u.orders.length}</td>
                <td className="px-3 py-2">{formatUsd(u.orders.reduce((s, o) => s + o.amountCents, 0))}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(u.createdAt)}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(u.lastLoginAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
