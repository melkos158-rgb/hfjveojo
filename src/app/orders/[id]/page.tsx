import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadOrderForViewer, publicOrderStatus, PAID_STATUSES } from "@/lib/orders/access";
import { GaPurchase, TrackedDownload } from "@/components/GaEvents";
import { OrderStatusLive } from "@/components/OrderStatusLive";
import { FeedbackForm } from "@/components/FeedbackForm";
import { signedFileUrl } from "@/lib/storage";
import { formatUsd } from "@/lib/ai/pricing";
import { site } from "@/config/site";
import { CopyLink } from "@/components/CopyLink";
import { DeliverableText } from "@/components/DeliverableText";
import { getToolBySlug } from "@/lib/tools/registry";
import { deliveredOutputs, lastDeliveredAt } from "@/lib/orders/deliverables";
import { disclosureLine, ensurePublicToken, isLabeledOutput, originalPhotoUrl } from "@/lib/tools/disclosure";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

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
  // Only the latest delivered set is shown (a re-run or a redo replaces files instead of adding to them). While a
  // redo is being made, the customer keeps the files of the last delivery.
  const shown = deliveredOutputs(order.outputs);
  const redoInProgress = !delivered && shown.length > 0 && ["PAID", "PROCESSING", "RETRYING", "REVIEW", "FAILED"].includes(order.status);
  const showFiles = delivered || redoInProgress;
  const deliveredAt = lastDeliveredAt(order.outputs) ?? order.deliveredAt;
  const markdownOut = shown.find((o) => o.type === "MARKDOWN");
  const md = (markdownOut?.content as { markdown?: string } | null)?.markdown;
  const images = shown.filter((o) => o.type === "IMAGE" && o.fileId && !isLabeledOutput(o));
  const labeled = shown.filter((o) => o.type === "IMAGE" && o.fileId && isLabeledOutput(o));
  // For photo tools the customer's own upload is shown next to the results (before → after).
  const toolDef = getToolBySlug(order.tool.slug);
  const imageField = toolDef?.intake.fields.find((f) => f.type === "image");
  // Disclosure pack (AB 723 / MLS) for digitally altered photos; orders from before it get their public link now.
  const publicToken = toolDef?.disclosurePack && showFiles ? (order.publicToken ?? (await ensurePublicToken(order.id))) : null;
  const beforeFileId = imageField ? (order.intake as Record<string, unknown>)[imageField.key] : undefined;
  const beforeUrl = typeof beforeFileId === "string" && beforeFileId ? signedFileUrl(beforeFileId) : undefined;

  return (
    <div className="container-x max-w-3xl py-12">
      <OrderStatusLive orderId={order.id} token={t} initialStatus={order.status} />
      {PAID_STATUSES.includes(order.status) && !order.isTest ? (
        <GaPurchase
          orderId={order.id}
          tool={{ slug: order.tool.slug, name: order.tool.name }}
          amountCents={order.payments[0]?.amountCents ?? order.amountCents}
          currency={order.payments[0]?.currency ?? order.currency}
          completed={delivered}
        />
      ) : null}
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
          <div className="font-medium">{(delivered ? deliveredAt : order.dueAt)?.toISOString().slice(0, 16).replace("T", " ") ?? "—"} UTC</div>
        </div>
      </div>

      {t ? (
        <div className="mt-6">
          <CopyLink url={`${site.url}/orders/${order.id}?t=${encodeURIComponent(t)}`} label={showFiles ? "Your files stay here for 90 days — keep this link" : "Your private order link"} />
        </div>
      ) : null}

      {order.status === "PENDING" ? (
        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">Waiting for Stripe to confirm the payment. If you closed the checkout, <Link className="underline" href={`/tools/${order.tool.slug}`}>start again</Link>.</p>
      ) : null}

      {redoInProgress ? (
        <p className="mt-6 rounded-lg bg-accent-soft px-4 py-3 text-sm text-gray-700">
          We&rsquo;re redoing this order. Below are the files from your last delivery; the new version replaces them here and arrives by email by the &ldquo;expected by&rdquo; time above.
        </p>
      ) : null}

      {!redoInProgress && ["REVIEW", "RETRYING", "FAILED"].includes(order.status) && order.tool.fulfillment === "AUTO" ? (
        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
          A person is finishing this order by hand, so it can take longer than the usual few minutes — the &ldquo;expected by&rdquo; time above still stands. If it is not here by then, <Link className="underline" href="/contact">tell us</Link>: we deliver it or <Link className="underline" href="/refund-policy">refund you</Link>.
        </p>
      ) : null}

      {showFiles ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold">{redoInProgress ? "Your files (last delivery)" : "Your files"}</h2>
          {images.length > 0 ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {beforeUrl ? (
                <figure className="card p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={beforeUrl} alt="Your original photo" className="h-auto w-full rounded-lg border border-line" />
                  <figcaption className="mt-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Before · your photo</figcaption>
                </figure>
              ) : null}
              {images.map((o, i) => {
                const url = signedFileUrl(o.fileId as string);
                return (
                  <figure key={o.id} className="card p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={o.title} className="h-auto w-full rounded-lg border border-line" />
                    <figcaption className="mt-2 flex flex-col gap-2">
                      <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">After · version {i + 1}</span>
                      <TrackedDownload href={url} tool={order.tool.slug} kind="image" className="btn-secondary justify-center px-3 py-1.5 text-xs" download>
                        Download photo
                      </TrackedDownload>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          ) : null}
          <ul className="mt-3 space-y-2">
            {shown
              .filter((o) => (o.fileId && o.type !== "IMAGE") || o.type === "LINK")
              .map((o) => {
                const link = o.type === "LINK" ? (o.content as { url?: string })?.url : o.fileId ? signedFileUrl(o.fileId) : undefined;
                return (
                  <li key={o.id} className="card flex items-center justify-between">
                    <span className="font-medium">{o.title}</span>
                    {link ? (
                      <TrackedDownload href={link} tool={order.tool.slug} kind={o.type.toLowerCase()} className="btn-primary px-4 py-2">
                        {o.type === "LINK" ? "Open" : "Download"}
                      </TrackedDownload>
                    ) : null}
                  </li>
                );
              })}
          </ul>
          {publicToken ? (
            <div className="card mt-6">
              <h3 className="font-semibold">Disclosure pack — California AB 723 and MLS rules</h3>
              <p className="mt-1 text-sm text-gray-600">
                Virtually staged photos must be labelled, and buyers must be able to see the original. Use the labelled copies in ads and on social, put the line below next to the photo, and link or print the original.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <CopyLink url={originalPhotoUrl(publicToken)} label="Public page with the original photo" hint="Anyone with this link can see the unaltered photo — that is the point. It stays live while your files are kept (90 days)." />
                  <CopyLink url={disclosureLine(publicToken)} label="Line to put next to the staged photo" hint={null} wrap />
                  {labeled.length ? (
                    <div className="flex flex-wrap gap-2">
                      {labeled.map((o, i) => (
                        <TrackedDownload key={o.id} href={signedFileUrl(o.fileId as string)} tool={order.tool.slug} kind="image_labeled" className="btn-secondary px-3 py-1.5 text-xs" download>
                          Download version {((o.content ?? {}) as { version?: number }).version ?? i + 1} labelled
                        </TrackedDownload>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/original/${publicToken}/qr`} alt="QR code that opens the original photo" width={132} height={132} className="mx-auto rounded-lg border border-line bg-white p-1" />
                  <a href={`/original/${publicToken}/qr`} download="original-photo-qr.png" className="mt-2 inline-block text-xs text-accent hover:underline">
                    QR for flyers (PNG)
                  </a>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                On the MLS, follow your board&apos;s labelling (usually &ldquo;virtually staged&rdquo; or &ldquo;digitally altered&rdquo;, with the original uploaded right after the staged photo). This helps you comply; it is not legal advice.
              </p>
            </div>
          ) : null}
          {md ? (
            shown.some((o) => o.type === "PDF" || o.type === "LINK") ? (
              <details className="card mt-4">
                <summary className="cursor-pointer font-semibold">{markdownOut?.title ?? "Text version"}</summary>
                <div className="mt-3">
                  <DeliverableText markdown={md} title={markdownOut?.title ?? "Text version"} />
                </div>
              </details>
            ) : (
              <div className="mt-4">
                <DeliverableText markdown={md} title={markdownOut?.title ?? "Your text"} />
              </div>
            )
          ) : null}
          {delivered ? (
            <>
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
            </>
          ) : null}
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
