import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getToolById } from "@/lib/tools/registry";
import { StatusBadge, fmtDate } from "@/components/admin/Kpi";
import { formatUsd, microsToCents } from "@/lib/ai/pricing";
import { signedFileUrl } from "@/lib/storage";
import { orderUrl } from "@/lib/orders/service";
import { closeTestOrderAction, deliverOrderAction, markQcApprovedAction, refundOrderAction, retryOrderAction, saveOrderNotesAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      tool: true,
      product: true,
      payments: true,
      refunds: true,
      runs: { orderBy: { startedAt: "desc" } },
      outputs: { orderBy: { createdAt: "desc" } },
      aiRequests: { orderBy: { createdAt: "asc" } },
      feedback: true,
      jobs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!order) notFound();
  const def = getToolById(order.toolId);
  const aiCost = order.aiRequests.reduce((s, r) => s + r.costMicros, 0);
  const canDeliver = ["REVIEW", "PROCESSING", "FAILED", "PAID", "RETRYING"].includes(order.status);
  const canRefund = order.payments.some((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED");
  const intake = order.intake as Record<string, unknown>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.number} · {order.tool.name}
              {order.isTest ? <span className="badge ml-2 bg-amber-50 text-amber-700">TEST</span> : null}
            </h1>
            <p className="text-sm text-gray-600">
              {order.customerEmail} · {formatUsd(order.amountCents)} · created {fmtDate(order.createdAt)} · paid {fmtDate(order.paidAt)}
            </p>
            <a className="text-xs text-brand underline" href={orderUrl(order)} target="_blank" rel="noreferrer">
              Customer order page
            </a>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="badge bg-mist text-ink">QC {order.qcStatus}</span>
          </div>
        </div>

        {order.qcNotes ? <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm whitespace-pre-wrap">{order.qcNotes}</div> : null}
        {order.errorMessage ? <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm">{order.errorMessage}</div> : null}

        <section className="card">
          <h2 className="font-bold">Intake</h2>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(intake).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase text-gray-500">{k}</dt>
                <dd className="whitespace-pre-wrap break-words">{typeof v === "string" && /^https?:\/\//.test(v) ? <a className="text-brand underline" href={v} target="_blank" rel="noreferrer">{v}</a> : String(v)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {def?.conciergeChecklist && def.fulfillment !== "AUTO" ? (
          <section className="card">
            <h2 className="font-bold">Concierge checklist</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {def.conciergeChecklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="card">
          <h2 className="font-bold">Outputs ({order.outputs.length})</h2>
          <div className="mt-2 space-y-3">
            {order.outputs.map((o) => {
              const md = (o.content as { markdown?: string; url?: string } | null) ?? {};
              return (
                <details key={o.id} className="rounded-lg border border-line p-3" open={o.type === "MARKDOWN"}>
                  <summary className="cursor-pointer text-sm font-semibold">
                    {o.type} · {o.title} · v{o.version} · {fmtDate(o.createdAt)}
                  </summary>
                  {o.fileId ? (
                    <a className="mt-2 inline-block text-sm text-brand underline" href={signedFileUrl(o.fileId)}>
                      Download file
                    </a>
                  ) : null}
                  {md.url ? (
                    <a className="mt-2 block text-sm text-brand underline" href={md.url} target="_blank" rel="noreferrer">
                      {md.url}
                    </a>
                  ) : null}
                  {md.markdown ? <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-xs">{md.markdown}</pre> : null}
                  {o.type === "JSON" ? <pre className="mt-2 max-h-96 overflow-auto text-xs">{JSON.stringify(o.content, null, 2)}</pre> : null}
                </details>
              );
            })}
            {order.outputs.length === 0 ? <p className="text-sm text-gray-500">Nothing generated yet.</p> : null}
          </div>
        </section>

        <section className="card">
          <h2 className="font-bold">Runs & AI usage</h2>
          {order.runs.map((r) => (
            <div key={r.id} className="mt-2 rounded-lg border border-line p-3 text-xs">
              <div className="flex justify-between">
                <span>
                  <StatusBadge status={r.status} /> v{r.toolVersion} · {fmtDate(r.startedAt)} → {fmtDate(r.finishedAt)}
                </span>
                <span>{formatUsd(Math.round(microsToCents(r.costMicros)))}</span>
              </div>
              <ul className="mt-1 list-disc pl-4">
                {(r.steps as Array<{ step: string; note?: string }>).map((s, i) => (
                  <li key={i}>
                    {s.step}
                    {s.note ? ` — ${s.note}` : ""}
                  </li>
                ))}
              </ul>
              {r.error ? <p className="mt-1 text-red-600">{r.error}</p> : null}
            </div>
          ))}
          <p className="mt-3 text-sm">
            AI calls: {order.aiRequests.length} · tokens in/out {order.aiRequests.reduce((s, r) => s + r.inputTokens, 0)}/{order.aiRequests.reduce((s, r) => s + r.outputTokens, 0)} · cost{" "}
            <strong>{formatUsd(Math.round(microsToCents(aiCost)))}</strong> · margin after AI {formatUsd(order.amountCents - Math.round(microsToCents(aiCost)))}
          </p>
        </section>
      </div>

      <aside className="space-y-4">
        {canDeliver ? (
          <form action={deliverOrderAction} className="card space-y-2">
            <input type="hidden" name="orderId" value={order.id} />
            <h3 className="font-bold">Deliver</h3>
            <p className="text-xs text-gray-600">
              {def?.fulfillment === "AUTO" ? "Approve the generated outputs and email the customer." : "Paste the share link with the finished files, then deliver."}
            </p>
            {def?.fulfillment !== "AUTO" ? <input name="deliveryLink" className="field-input" placeholder="https://drive.google.com/..." /> : null}
            <input name="note" className="field-input" placeholder="Optional note to the customer" />
            <button className="btn-primary w-full" type="submit">
              Mark delivered & email customer
            </button>
          </form>
        ) : null}

        {order.qcStatus === "FLAGGED" ? (
          <form action={markQcApprovedAction} className="card">
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn-secondary w-full" type="submit">
              Approve QC flags (no delivery yet)
            </button>
          </form>
        ) : null}

        {order.isTest && !["CANCELED", "REFUNDED"].includes(order.status) ? (
          <form action={closeTestOrderAction} className="card">
            <input type="hidden" name="orderId" value={order.id} />
            <h3 className="font-bold">Test order</h3>
            <p className="mb-2 text-xs text-gray-600">Created by the admin pipeline test — no payment was made. Close it to clear the queue (no email is sent).</p>
            <button className="btn-secondary w-full" type="submit">
              Close test order
            </button>
          </form>
        ) : null}

        {["REVIEW", "FAILED", "RETRYING", "PROCESSING"].includes(order.status) ? (
          <form action={retryOrderAction} className="card">
            <input type="hidden" name="orderId" value={order.id} />
            <h3 className="font-bold">Re-run pipeline</h3>
            <p className="mb-2 text-xs text-gray-600">Generates a new version of the outputs (previous versions are kept).</p>
            <button className="btn-secondary w-full" type="submit">
              Retry
            </button>
          </form>
        ) : null}

        {canRefund ? (
          <form action={refundOrderAction} className="card space-y-2">
            <input type="hidden" name="orderId" value={order.id} />
            <h3 className="font-bold">Refund (Stripe)</h3>
            <input name="amountCents" className="field-input" placeholder={`Amount in cents (default full: ${order.amountCents})`} />
            <input name="reason" className="field-input" placeholder="Reason (internal)" />
            <button className="btn-danger w-full" type="submit">
              Refund now
            </button>
            <p className="text-xs text-gray-500">Money moves immediately. Refunds already issued: {order.refunds.filter((r) => r.status === "SUCCEEDED").map((r) => formatUsd(r.amountCents)).join(", ") || "none"}.</p>
          </form>
        ) : null}

        <form action={saveOrderNotesAction} className="card space-y-2">
          <input type="hidden" name="orderId" value={order.id} />
          <h3 className="font-bold">Internal notes</h3>
          <textarea name="adminNotes" className="field-input" rows={4} defaultValue={order.adminNotes ?? ""} />
          <button className="btn-secondary w-full" type="submit">
            Save notes
          </button>
        </form>

        <div className="card text-xs text-gray-600">
          <h3 className="font-bold text-ink">Payments</h3>
          {order.payments.map((p) => (
            <div key={p.id} className="mt-1">
              {p.status} · {formatUsd(p.amountCents)} · refunded {formatUsd(p.amountRefundedCents)} ·{" "}
              {p.receiptUrl ? (
                <a className="underline" href={p.receiptUrl} target="_blank" rel="noreferrer">
                  receipt
                </a>
              ) : null}
            </div>
          ))}
          {order.payments.length === 0 ? <p>No payment recorded (webhook not received yet).</p> : null}
          <h3 className="mt-3 font-bold text-ink">Jobs</h3>
          {order.jobs.map((j) => (
            <div key={j.id} className="mt-1">
              {j.type} · <StatusBadge status={j.status} /> · attempts {j.attempts}/{j.maxAttempts} {j.lastError ? `· ${j.lastError.slice(0, 80)}` : ""}
            </div>
          ))}
          {order.feedback.length > 0 ? (
            <>
              <h3 className="mt-3 font-bold text-ink">Feedback</h3>
              {order.feedback.map((f) => (
                <p key={f.id} className="mt-1">
                  [{f.rating ?? "-"}/5] {f.text}
                </p>
              ))}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
