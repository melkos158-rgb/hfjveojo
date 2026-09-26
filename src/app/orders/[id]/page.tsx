import Link from "next/link";
import { notFound } from "next/navigation";
import { loadOrderForViewer, publicOrderStatus } from "@/lib/orders/access";
import { OrderStatusLive } from "@/components/OrderStatusLive";
import { FeedbackForm } from "@/components/FeedbackForm";
import { signedFileUrl } from "@/lib/storage";
import { formatUsd } from "@/lib/ai/pricing";
import { site } from "@/config/site";
import { CopyLink } from "@/components/CopyLink";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> };

const tones: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
};

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t } = await searchParams;
  const order = await loadOrderForViewer(id, t);
  if (!order) notFound();
  const st = publicOrderStatus(order.status);
  const delivered = order.status === "COMPLETED";
  const markdownOut = order.outputs.find((o) => o.type === "MARKDOWN");
  const md = (markdownOut?.content as { markdown?: string } | null)?.markdown;

  return (
    <div className="container-x max-w-3xl py-12">
      <OrderStatusLive orderId={order.id} token={t} initialStatus={order.status} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Order #{order.number}</p>
          <h1 className="mt-1 text-2xl font-bold">{order.tool.name}</h1>
        </div>
        <span className={`badge ${tones[st.tone]}`}>{st.label}</span>
      </div>

      <div className="card mt-6 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <div className="text-gray-500">Placed</div>
          <div className="font-medium">{order.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</div>
        </div>
        <div>
          <div className="text-gray-500">Amount</div>
          <div className="font-medium">{formatUsd(order.amountCents)}</div>
        </div>
        <div>
          <div className="text-gray-500">{delivered ? "Delivered" : "Expected by"}</div>
          <div className="font-medium">{(delivered ? order.deliveredAt : order.dueAt)?.toISOString().slice(0, 16).replace("T", " ") ?? "—"} UTC</div>
        </div>
      </div>

      {t ? (
        <div className="mt-6">
          <CopyLink url={`${site.url}/orders/${order.id}?t=${encodeURIComponent(t)}`} label={delivered ? "Your files stay here for 90 days — keep this link" : "Your private order link"} />
        </div>
      ) : null}

      {order.status === "PENDING" ? (
        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">Waiting for Stripe to confirm the payment. If you closed the checkout, <Link className="underline" href={`/tools/${order.tool.slug}`}>start again</Link>.</p>
      ) : null}

      {["REVIEW", "RETRYING", "FAILED"].includes(order.status) ? (
        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
          A person is finishing this order by hand, so it can take longer than the usual few minutes — the &ldquo;expected by&rdquo; time above still stands. If it is not here by then, <Link className="underline" href="/contact">tell us</Link>: we deliver it or <Link className="underline" href="/refund-policy">refund you</Link>.
        </p>
      ) : null}

      {delivered ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Your files</h2>
          <ul className="mt-3 space-y-2">
            {order.outputs
              .filter((o) => o.fileId || o.type === "LINK")
              .map((o) => {
                const link = o.type === "LINK" ? (o.content as { url?: string })?.url : o.fileId ? signedFileUrl(o.fileId) : undefined;
                return (
                  <li key={o.id} className="card flex items-center justify-between">
                    <span className="font-medium">{o.title}</span>
                    {link ? (
                      <a href={link} className="btn-primary px-4 py-2" target="_blank" rel="noopener noreferrer">
                        {o.type === "LINK" ? "Open" : "Download"}
                      </a>
                    ) : null}
                  </li>
                );
              })}
          </ul>
          {md ? (
            <details className="card mt-4" open={!order.outputs.some((o) => o.type === "PDF" || o.type === "LINK")}>
              <summary className="cursor-pointer font-semibold">{markdownOut?.title ?? "Text version"}</summary>
              <pre className="mt-3 font-sans text-sm whitespace-pre-wrap text-gray-700 select-all">{md}</pre>
            </details>
          ) : null}
          <div className="card mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Got another one?</h3>
              <p className="text-sm text-gray-600">Same price, same turnaround — {order.tool.name} for the next listing or enquiry.</p>
            </div>
            <Link href={`/tools/${order.tool.slug}`} className="btn-primary">
              Order again
            </Link>
          </div>
          <div className="card mt-6">
            <h3 className="font-semibold">How did we do?</h3>
            <p className="mb-3 text-sm text-gray-600">One revision round is included — tell us what to change, or what you loved.</p>
            {order.feedback.length > 0 ? <p className="text-sm text-green-700">Thanks, we have your feedback.</p> : <FeedbackForm orderId={order.id} token={t} />}
          </div>
        </section>
      ) : order.status !== "PENDING" ? (
        <section className="mt-8 card">
          <h2 className="font-semibold">What happens now</h2>
          <p className="mt-2 text-sm text-gray-600">
            {order.tool.fulfillment === "AUTO"
              ? "Your deliverable is being generated and checked. This page refreshes automatically; you'll also get an email."
              : "Our editor has your brief. You'll get an email the moment the files are ready — usually well within the promised window."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
