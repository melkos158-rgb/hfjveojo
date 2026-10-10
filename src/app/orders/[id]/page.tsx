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
import { photoInputsOf } from "@/lib/tools/photos";
import type { ToolDefinition } from "@/lib/tools/types";
import { prisma } from "@/lib/db";
import { VOUCHER_KEY_PREFIX, descriptionVoucherUrl, isCreditOrder, isFreePhotoOrder, isVoucherOrder, orderHasVoucher } from "@/lib/orders/voucher";
import { creditBalance, CREDIT_TOOL_SLUG, CREDIT_USE_TOOL_SLUG } from "@/lib/orders/credits";
import { getSession } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/magic";
import { finishEndsAt, finishUrl } from "@/lib/orders/finish";
import { STAGING_FINISH_PACK } from "@/config/staging-pricing";
import { isProspectPreview } from "@/lib/orders/prospect-rules";

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
  // Disclosure pack (AB 723 / MLS) for digitally altered photos; orders from before it get their public link now.
  const publicToken = toolDef?.disclosurePack && showFiles ? (order.publicToken ?? (await ensurePublicToken(order.id))) : null;
  // Photo tools: each uploaded photo next to its results (multi-room orders: one row per room).
  const befores = photoInputsOf(toolDef as ToolDefinition<unknown> | undefined, order.intake);
  const meta = (o: { content: unknown }) => (o.content ?? {}) as { room?: number; version?: number };
  const rooms =
    befores.length > 1
      ? befores.map((b, idx) => ({ n: idx + 1, before: b, images: images.filter((o) => (meta(o).room ?? 1) === idx + 1), labeled: labeled.filter((o) => (meta(o).room ?? 1) === idx + 1) }))
      : [{ n: 1, before: befores[0], images, labeled }];
  const multiRoom = rooms.length > 1;
  // The MLS description included with a Listing Pack (or the $7 add-on): a link to write it, or the order it became.
  const voucherOpen = orderHasVoucher(order) && !order.free && !["PENDING", "CANCELED", "REFUNDED"].includes(order.status);
  const voucherUsed = voucherOpen
    ? await prisma.order.findUnique({ where: { freeKey: `${VOUCHER_KEY_PREFIX}${order.id}` }, select: { id: true, number: true, accessToken: true } })
    : null;
  const freePhoto = isFreePhotoOrder(order);
  // A room staged for a prospect after they agreed (court lever 2): the same page, worded as their preview.
  const prospectPreview = isProspectPreview(order);
  // "Finish this listing" for 7 days after a delivered free photo or prospect preview.
  const finishLink = (freePhoto || prospectPreview) && delivered && toolDef?.freeFirstPhoto ? finishUrl(order.id, order.deliveredAt) : null;
  // A paid Pro credits purchase: the balance and how to use it (sign in with the buying email).
  const creditPack = order.toolId === CREDIT_TOOL_SLUG && !order.free && order.paidAt && !["REFUNDED", "CANCELED"].includes(order.status) ? await creditBalance(order.customerEmail) : null;
  const session = creditPack ? await getSession() : null;
  const signedInAsBuyer = Boolean(session?.email && normalizeEmail(session.email) === normalizeEmail(order.customerEmail));
  const stageHref = `/tools/${CREDIT_USE_TOOL_SLUG}#order`;

  return (
    <div className="container-x max-w-3xl py-12">
      <OrderStatusLive orderId={order.id} token={t} initialStatus={order.status} />
      {PAID_STATUSES.includes(order.status) && !order.isTest && !order.free ? (
        <GaPurchase
          orderId={order.id}
          tool={{ slug: order.tool.slug, name: order.tool.name }}
          amountCents={order.payments[0]?.amountCents ?? order.amountCents}
          currency={order.payments[0]?.currency ?? order.currency}
          quantity={order.quantity}
          completed={delivered}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{prospectPreview ? "A free preview for you" : `Order #${order.number}`}</p>
          <h1 className="mt-1 text-2xl font-bold">{prospectPreview ? "Your room, virtually staged" : order.tool.name}</h1>
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
          <div className="font-medium">
            {isVoucherOrder(order)
              ? "Included with your staging order"
              : isCreditOrder(order)
                ? `Paid with Pro credits (${order.quantity} room${order.quantity === 1 ? "" : "s"})`
                : prospectPreview
                  ? "Free — a preview of your room"
                  : order.free
                  ? "Free — your first photo"
                  : formatUsd(order.amountCents)}
          </div>
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

      {prospectPreview && showFiles ? (
        <p className="mt-6 rounded-lg bg-accent-soft px-4 py-3 text-sm text-gray-700" data-prospect-intro>
          We staged this room from your photo as a free preview: two versions at full resolution, no watermark, plus copies labeled
          &ldquo;Virtually staged&rdquo; for ads and social.
          {finishLink && order.deliveredAt ? (
            <>
              {" "}
              Want the rest of the listing?{" "}
              <a href={finishLink} className="font-semibold underline">
                Finish it for {formatUsd(STAGING_FINISH_PACK.cents).replace(/\.00$/, "")}
              </a>{" "}
              (up to {STAGING_FINISH_PACK.units} more rooms plus the MLS description, until {finishEndsAt(order.deliveredAt).toISOString().slice(0, 10)}).
            </>
          ) : null}
        </p>
      ) : null}

      {order.status === "PENDING" ? (
        order.free ? (
          <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">Waiting for you to confirm your email: click the link in the email we sent, and staging starts right away.</p>
        ) : (
          <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">Waiting for Stripe to confirm the payment. If you closed the checkout, <Link className="underline" href={`/tools/${order.tool.slug}`}>start again</Link>.</p>
        )
      ) : null}

      {!redoInProgress && ["PAID", "PROCESSING"].includes(order.status) ? (
        <p className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {order.quantity > 1 && toolDef?.pricing.unit ? `Working on your ${order.quantity} ${toolDef.pricing.unit.many}` : "Working on your order"}
          {toolDef ? ` — ${toolDef.io.processingTime.charAt(0).toLowerCase()}${toolDef.io.processingTime.slice(1)}` : ""}. This page updates by itself, and we email you when it&rsquo;s ready.
        </p>
      ) : null}

      {creditPack ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3" data-credits>
          <div>
            <h3 className="font-semibold">
              Your Pro credits: {creditPack.rooms} room{creditPack.rooms === 1 ? "" : "s"} left
            </h3>
            <p className="text-sm text-gray-600">
              {creditPack.validUntil ? `Valid until ${creditPack.validUntil.toISOString().slice(0, 10)}. ` : ""}
              {signedInAsBuyer ? "Open Virtual Staging and keep “Use my Pro credits” ticked." : `Sign in with ${order.customerEmail}, open Virtual Staging and keep “Use my Pro credits” ticked.`}
            </p>
          </div>
          {creditPack.rooms > 0 ? (
            <a href={signedInAsBuyer ? stageHref : `/login?next=${encodeURIComponent(stageHref)}`} className="btn-primary">
              {signedInAsBuyer ? "Stage photos" : "Sign in and stage photos"}
            </a>
          ) : null}
        </div>
      ) : null}

      {voucherOpen ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3" data-voucher>
          {voucherUsed ? (
            <>
              <div>
                <h3 className="font-semibold">Your MLS description</h3>
                <p className="text-sm text-gray-600">Written — it&rsquo;s on its own order page, and we emailed it to you.</p>
              </div>
              <Link href={`/orders/${voucherUsed.id}?t=${encodeURIComponent(voucherUsed.accessToken)}`} className="btn-secondary">
                Open order #{voucherUsed.number}
              </Link>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold">Your MLS listing description is included</h3>
                <p className="text-sm text-gray-600">Enter the listing facts (about 2 minutes) and get an MLS-ready description, a short version and social captions, checked for fair-housing wording.</p>
              </div>
              <a href={descriptionVoucherUrl(order.id)} className="btn-primary">
                Write my MLS description
              </a>
            </>
          )}
        </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{redoInProgress ? "Your files (last delivery)" : "Your files"}</h2>
            {shown.filter((o) => o.fileId).length > 1 ? (
              <TrackedDownload href={`/api/orders/${order.id}/zip${t ? `?t=${encodeURIComponent(t)}` : ""}`} tool={order.tool.slug} kind="zip" className="btn-secondary px-4 py-2 text-sm" download>
                Download all (ZIP)
              </TrackedDownload>
            ) : null}
          </div>
          {images.length > 0
            ? rooms.map((room) => (
                <div key={room.n} className="mt-3">
                  {multiRoom ? <h3 className="mb-2 text-sm font-semibold text-gray-600">{room.before?.label ?? `Room ${room.n}`}</h3> : null}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {room.before ? (
                      <figure className="card p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={signedFileUrl(room.before.fileId)} alt="Your original photo" className="h-auto w-full rounded-lg border border-line" />
                        <figcaption className="mt-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Before · your photo</figcaption>
                      </figure>
                    ) : null}
                    {room.images.map((o, i) => {
                      const url = signedFileUrl(o.fileId as string);
                      return (
                        <figure key={o.id} className="card p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={o.title} className="h-auto w-full rounded-lg border border-line" />
                          <figcaption className="mt-2 flex flex-col gap-2">
                            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">After · version {meta(o).version ?? i + 1}</span>
                            <TrackedDownload href={url} tool={order.tool.slug} kind="image" className="btn-secondary justify-center px-3 py-1.5 text-xs" download>
                              Download photo
                            </TrackedDownload>
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                </div>
              ))
            : null}
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
                Virtually staged photos must be labeled, and buyers must be able to see the original. Use the labeled copies in ads and on social, put the line below next to the photo, and link or print the original.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                {/* min-w-0: the long links truncate inside the grid instead of pushing the page wider than a phone. */}
                <div className="min-w-0 space-y-3">
                  <CopyLink url={originalPhotoUrl(publicToken)} label="Public page with the original photo" hint="Anyone with this link can see the unaltered photo — that is the point. It stays live while your files are kept (90 days)." />
                  <CopyLink url={disclosureLine(publicToken)} label="Line to put next to the staged photo" hint={null} wrap />
                  {labeled.length ? (
                    <div className="flex flex-wrap gap-2">
                      {rooms.flatMap((room) =>
                        room.labeled.map((o, i) => (
                          <TrackedDownload key={o.id} href={signedFileUrl(o.fileId as string)} tool={order.tool.slug} kind="image_labeled" className="btn-secondary px-3 py-1.5 text-xs" download>
                            {multiRoom ? `Room ${room.n} · v${meta(o).version ?? i + 1} labeled` : `Download version ${meta(o).version ?? i + 1} labeled`}
                          </TrackedDownload>
                        )),
                      )}
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
                On the MLS, upload the unlabeled versions and follow your board&apos;s rules. Stellar MLS (Florida), for example, allows no words on
                photos: write &ldquo;Virtually staged&rdquo; in the photo description, tick the virtually staged box and start the public remarks with
                &ldquo;One or more photo(s) was virtually staged.&rdquo; ARMLS (Arizona) wants its Flexmls Digitally Altered watermark on each staged
                photo and the original directly before or after it. This helps you comply; it is not legal advice. Checklists:{" "}
                <Link className="underline" href="/guides/stellar-mls-virtual-staging">Stellar MLS</Link>,{" "}
                <Link className="underline" href="/guides/armls-virtual-staging">ARMLS</Link>,{" "}
                <Link className="underline" href="/guides/ab-723-virtual-staging">California AB 723</Link>; wording for each place:{" "}
                <Link className="underline" href="/guides/virtual-staging-disclaimer">disclaimer examples</Link>.
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
                {finishLink && order.deliveredAt ? (
                  <>
                    <div>
                      <h3 className="font-semibold">Finish this listing — {formatUsd(STAGING_FINISH_PACK.cents).replace(/\.00$/, "")}</h3>
                      <p className="text-sm text-gray-600">
                        Your free room counts as the first one: up to {STAGING_FINISH_PACK.units} more rooms of the same listing plus the MLS description for{" "}
                        {formatUsd(STAGING_FINISH_PACK.cents).replace(/\.00$/, "")}, same two versions and disclosure pack. Until {finishEndsAt(order.deliveredAt).toISOString().slice(0, 10)}.
                      </p>
                    </div>
                    <a href={finishLink} className="btn-primary">
                      Finish this listing
                    </a>
                  </>
                ) : (freePhoto || prospectPreview) && toolDef ? (
                  <>
                    <div>
                      <h3 className="font-semibold">Stage the rest of the listing</h3>
                      <p className="text-sm text-gray-600">
                        {toolDef.pricing.pack
                          ? `The whole listing — up to ${toolDef.pricing.pack.units} rooms plus ${toolDef.pricing.packIncludes ?? "extras"} — for ${formatUsd(toolDef.pricing.pack.cents)}, or ${formatUsd(toolDef.pricing.priceCents)} a room. Same two versions and disclosure pack.`
                          : `${formatUsd(toolDef.pricing.priceCents)} per photo, up to ${toolDef.intake.fields.find((f) => f.type === "rooms")?.max ?? 6} rooms in one order, same two versions and disclosure pack.`}
                      </p>
                    </div>
                    <Link href={`/tools/${order.tool.slug}#order`} className="btn-primary">
                      Stage more photos
                    </Link>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold">Got another one?</h3>
                      <p className="text-sm text-gray-600">Same price, same turnaround — {order.tool.name} for the next listing or enquiry.</p>
                    </div>
                    <Link href={`/tools/${order.tool.slug}`} className="btn-primary">
                      Order again
                    </Link>
                  </>
                )}
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
