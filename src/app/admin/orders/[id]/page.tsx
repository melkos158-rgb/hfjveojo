import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getToolById } from "@/lib/tools/registry";
import { StatusBadge, fmtDate } from "@/components/admin/Kpi";
import { formatUsd, microsToCents } from "@/lib/ai/pricing";
import { signedFileUrl } from "@/lib/storage";
import { orderUrl } from "@/lib/orders/service";
import { closeTestOrderAction, deliverOrderAction, markQcApprovedAction, redoOrderAction, refundOrderAction, retryOrderAction, saveOrderNotesAction } from "@/app/admin/actions";
import { deliveredOutputs } from "@/lib/orders/deliverables";

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
  const withCustomer = new Set(deliveredOutputs(order.outputs).map((o) => o.id));
  const redos = await prisma.adminAction.count({ where: { action: "redo_order", targetType: "order", targetId: order.id } });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.number} · {order.tool.name}
              {order.isTest ? <span className="badge ml-2 bg-amber-50 text-amber-700">TEST</span> : null}
              <span className={`badge ml-2 ${order.livemode ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>{order.livemode ? "Stripe LIVE" : "Stripe sandbox"}</span>
            </h1>
            <p className="text-sm text-gray-600">
              {order.customerEmail} · {formatUsd(order.amountCents)}
              {order.quantity > 1 ? ` (${order.quantity} × ${formatUsd(Math.round(order.amountCents / order.quantity))})` : ""} · created {fmtDate(order.createdAt)} · paid {fmtDate(order.paidAt)}
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
            {Object.entries(intake).map(([k, v]) => {
              const isImage = def?.intake.fields.some((f) => f.key === k && f.type === "image") && typeof v === "string" && v.length > 0;
              const isRooms = def?.intake.fields.some((f) => f.key === k && f.type === "rooms") && Array.isArray(v);
              if (isRooms) {
                const list = v as Array<{ photoFileId?: string; roomType?: string }>;
                return (
                  <div key={k} className="sm:col-span-2">
                    <dt className="text-xs uppercase text-gray-500">
                      {k} ({list.length})
                    </dt>
                    <dd className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {list.map((room, idx) => (
                        <figure key={idx}>
                          {room.photoFileId ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={signedFileUrl(room.photoFileId)} alt={`Room ${idx + 1}`} className="max-h-40 w-full rounded-lg border border-line object-cover" />
                          ) : null}
                          <figcaption className="mt-1 text-xs text-gray-600">
                            Room {idx + 1} · {room.roomType ?? "?"}
                          </figcaption>
                        </figure>
                      ))}
                    </dd>
                  </div>
                );
              }
              return (
                <div key={k}>
                  <dt className="text-xs uppercase text-gray-500">{k}</dt>
                  <dd className="whitespace-pre-wrap break-words">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={signedFileUrl(v as string)} alt={k} className="mt-1 max-h-60 w-auto rounded-lg border border-line" />
                    ) : typeof v === "string" && /^https?:\/\//.test(v) ? (
                      <a className="text-brand underline" href={v} target="_blank" rel="noreferrer">
                        {v}
                      </a>
                    ) : (
                      String(v)
                    )}
                  </dd>
                </div>
              );
            })}
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
                    {o.type} · {o.title} · {o.toolRunId ? `run ${o.version}` : "manual"} · {fmtDate(o.createdAt)}
                    {withCustomer.has(o.id) ? (
                      <span className="badge ml-2 bg-green-50 text-green-700">with customer</span>
                    ) : o.deliveredAt ? (
                      <span className="badge ml-2 bg-gray-100 text-gray-700">replaced</span>
                    ) : null}
                  </summary>
                  {o.fileId && o.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signedFileUrl(o.fileId)} alt={o.title} className="mt-2 max-h-80 w-auto rounded-lg border border-line" />
                  ) : null}
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
                  {r.status === "RUNNING" && !r.finishedAt ? ` · last heartbeat ${Math.max(0, Math.round((Date.now() - (r.heartbeatAt ?? r.startedAt).getTime()) / 1000))}s ago` : ""}
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
            <p className="mb-2 text-xs text-gray-600">Runs the pipeline again. Earlier runs stay listed here; the customer only gets the newest set when it is delivered.</p>
            <button className="btn-secondary w-full" type="submit">
              Retry
            </button>
          </form>
        ) : null}

        {order.status === "COMPLETED" ? (
          <form action={redoOrderAction} className="card space-y-2">
            <input type="hidden" name="orderId" value={order.id} />
            <h3 className="font-bold">Free redo</h3>
            <p className="text-xs text-gray-600">
              One redo is included when the result is unusable (e.g. the room&rsquo;s structure changed). Runs the pipeline again on the same brief;{" "}
              {def?.fulfillment === "AUTO" ? "the new files are delivered automatically with a “Your redo is ready” email." : "the order goes back to REVIEW for you to deliver."} The customer keeps the current files until then.
            </p>
            <input name="reason" className="field-input" placeholder="What was wrong (internal)" maxLength={500} />
            {redos > 0 ? <p className="text-xs font-semibold text-amber-700">Already redone {redos}× — the included redo is used.</p> : null}
            <button className="btn-secondary w-full" type="submit">
              Redo order
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
