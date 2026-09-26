import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { publicOrderStatus, PAID_STATUSES } from "@/lib/orders/access";
import { formatUsd } from "@/lib/ai/pricing";
import { deliveredOutputs, lastDeliveredAt } from "@/lib/orders/deliverables";
import { isLabeledOutput } from "@/lib/tools/disclosure";
import { signedFileUrl } from "@/lib/storage";
import { site } from "@/config/site";
import { getToolById } from "@/lib/tools/registry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My orders", robots: { index: false } };

const tones: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
};

const IN_PROGRESS = ["PAID", "PROCESSING", "RETRYING", "REVIEW", "FAILED"];
const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
const time = (d: Date | null | undefined) => (d ? `${d.toISOString().slice(0, 16).replace("T", " ")} UTC` : "—");
/** "3 photos" for per-unit tools. */
const units = (o: { quantity: number; toolId: string }) => (o.quantity > 1 ? ` · ${o.quantity} ${getToolById(o.toolId)?.pricing.unit?.many ?? "items"}` : "");

/**
 * The customer's home: what is being made right now, everything delivered (with the files one click away), and
 * checkouts that were never paid. Orders are matched by account or by the verified email, and every link carries the
 * order's own access token, so orders placed before signing in open too.
 */
export default async function DashboardPage() {
  const user = await requireUserPage("/dashboard");
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { customerEmail: user.email }], isTest: false },
    include: {
      tool: true,
      outputs: { select: { id: true, type: true, title: true, fileId: true, content: true, deliveredAt: true, createdAt: true, toolRunId: true } },
      payments: { select: { amountCents: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const link = (o: { id: string; accessToken: string }) => `/orders/${o.id}?t=${encodeURIComponent(o.accessToken)}`;
  const active = orders.filter((o) => IN_PROGRESS.includes(o.status));
  const delivered = orders.filter((o) => o.status === "COMPLETED");
  const refunded = orders.filter((o) => o.status === "REFUNDED");
  const unpaid = orders.filter((o) => o.status === "PENDING" || o.status === "CANCELED");
  const spent = orders
    .filter((o) => PAID_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + (o.payments.filter((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED").reduce((s, p) => s + p.amountCents, 0) || o.amountCents), 0);

  return (
    <div className="container-x max-w-4xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My orders</h1>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tools" className="btn-primary px-4 py-2">
            New order
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="btn-secondary px-4 py-2" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <div className="card">
          <div className="text-gray-500">In progress</div>
          <div className="mt-1 text-xl font-bold">{active.length}</div>
        </div>
        <div className="card">
          <div className="text-gray-500">Delivered</div>
          <div className="mt-1 text-xl font-bold">{delivered.length}</div>
        </div>
        <div className="card">
          <div className="text-gray-500">Spent</div>
          <div className="mt-1 text-xl font-bold">{formatUsd(spent)}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card mt-8 text-sm text-gray-600">
          No orders yet. Pick a tool, upload what you have and get the finished result — <Link className="underline" href="/tools">browse tools</Link>.
        </div>
      ) : null}

      {active.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">In progress</h2>
          <ul className="mt-3 space-y-3">
            {active.map((o) => {
              const st = publicOrderStatus(o.status);
              return (
                <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      #{o.number} · {o.tool.name}
                      <span className={`badge ${tones[st.tone]}`}>{st.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Placed {time(o.createdAt)} · expected by {time(o.dueAt)}
                      {units(o)}
                    </div>
                  </div>
                  <Link href={link(o)} className="btn-secondary px-4 py-2">
                    Track
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {delivered.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Delivered</h2>
          <ul className="mt-3 space-y-3">
            {delivered.map((o) => {
              const shown = deliveredOutputs(o.outputs);
              const thumbs = shown.filter((x) => x.type === "IMAGE" && x.fileId && !isLabeledOutput(x)).slice(0, 4);
              const others = shown.filter((x) => x.type !== "IMAGE" && x.type !== "JSON").map((x) => x.title);
              return (
                <li key={o.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        #{o.number} · {o.tool.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Delivered {day(lastDeliveredAt(o.outputs) ?? o.deliveredAt)} · {formatUsd(o.amountCents)}
                        {units(o)} · files kept 90 days
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={link(o)} className="btn-primary px-4 py-2">
                        Open files
                      </Link>
                      <Link href={`/tools/${o.tool.slug}#order`} className="btn-secondary px-4 py-2">
                        Order again
                      </Link>
                    </div>
                  </div>
                  {thumbs.length > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-hidden">
                      {thumbs.map((t) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={t.id} src={signedFileUrl(t.fileId as string)} alt={t.title} loading="lazy" className="h-20 w-28 shrink-0 rounded-lg border border-line object-cover" />
                      ))}
                    </div>
                  ) : others.length > 0 ? (
                    <p className="mt-3 text-sm text-gray-600">{others.slice(0, 3).join(" · ")}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {refunded.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Refunded</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {refunded.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
                <span>
                  #{o.number} · {o.tool.name} · {formatUsd(o.amountCents)}
                </span>
                <Link href={link(o)} className="text-accent hover:underline">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {unpaid.length > 0 ? (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-gray-600">Checkouts you didn&rsquo;t finish ({unpaid.length})</summary>
          <p className="mt-2 text-xs text-gray-500">Nothing was charged for these. Checkout links expire after 30 minutes — start again from the tool.</p>
          <ul className="mt-2 space-y-2 text-sm">
            {unpaid.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
                <span>
                  {day(o.createdAt)} · {o.tool.name} · {formatUsd(o.amountCents)}
                </span>
                <Link href={`/tools/${o.tool.slug}#order`} className="text-accent hover:underline">
                  Start again
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-12 text-xs text-gray-500">
        Receipts come from Stripe by email with each payment. Questions or a redo? Reply to your delivery email or write to{" "}
        <a className="underline" href={`mailto:${site.supportEmail}`}>
          {site.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
