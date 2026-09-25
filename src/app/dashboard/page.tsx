import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { publicOrderStatus } from "@/lib/orders/access";
import { formatUsd } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function DashboardPage() {
  const user = await requireUserPage("/dashboard");
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { customerEmail: user.email }] },
    include: { tool: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="container-x max-w-3xl py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My orders</h1>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn-secondary px-4 py-2" type="submit">
            Sign out
          </button>
        </form>
      </div>
      {orders.length === 0 ? (
        <div className="card mt-8 text-sm text-gray-600">
          No orders yet. <Link className="underline" href="/tools">Browse tools</Link>.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => {
            const st = publicOrderStatus(o.status);
            return (
              <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    #{o.number} · {o.tool.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.createdAt.toISOString().slice(0, 10)} · {formatUsd(o.amountCents)} · {st.label}
                  </div>
                </div>
                <Link href={`/orders/${o.id}`} className="btn-secondary px-4 py-2">
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
