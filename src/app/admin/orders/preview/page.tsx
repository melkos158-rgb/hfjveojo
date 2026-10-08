import Link from "next/link";
import { getToolBySlug } from "@/lib/tools/registry";
import { requireAdminPage } from "@/lib/auth/guards";
import { ProspectPreviewForm } from "@/components/admin/ProspectPreviewForm";
import { StatusBadge, fmtDate } from "@/components/admin/Kpi";
import { CopyLink } from "@/components/CopyLink";
import { FINISH_TOOL_SLUG, finishEndsAt } from "@/lib/orders/finish";
import { PROSPECT_MAX_LENGTH, recentProspectPreviews } from "@/lib/orders/prospect";
import { orderUrl } from "@/lib/orders/service";

export const dynamic = "force-dynamic";

/**
 * Prospect previews (court ruling of 2026-10-06, operator lever 2): one room of an agent's own listing, staged after
 * they replied and agreed, on a private page whose link the owner sends in the conversation.
 */
export default async function ProspectPreviewsPage() {
  await requireAdminPage("/admin/orders/preview");
  const def = getToolBySlug(FINISH_TOOL_SLUG);
  const fields = (def?.intake.fields ?? []).map((f) => (f.type === "rooms" ? { ...f, max: 1, help: "One room: the photo they sent you, or the listing photo they said you can use." } : f));
  const rows = await recentProspectPreviews();
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Prospect previews</h1>
        <p className="text-sm text-gray-600">
          When an agent answers your message and says yes, stage one room of their listing here and send them the page. They see their own room in two
          versions, the labeled copies for the MLS, and &ldquo;Finish this listing&rdquo; ($39 for up to 4 more rooms plus the MLS description, for 7 days).
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Save the photo they sent (or the listing photo they told you to use).</li>
          <li>Upload it here with their handle and tap the button.</li>
          <li>The page they will get opens and fills in by itself in about 2 minutes. Copy its address and send it in the chat.</li>
        </ol>
        <p className="text-xs text-gray-500">Never from a listing they did not agree to: listing photos usually belong to the photographer. The preview does not use up their free photo on the site.</p>
        <Link href="/admin/orders" className="text-sm text-brand underline">
          Back to orders
        </Link>
      </div>
      <div className="space-y-6 lg:col-span-2">
        {def ? <ProspectPreviewForm fields={fields} maxLength={PROSPECT_MAX_LENGTH} /> : <div className="card text-sm text-gray-600">Virtual staging is not configured.</div>}
        <section className="card">
          <h2 className="font-bold">Recent previews</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">None yet.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {rows.map((r) => (
                <li key={r.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0" data-prospect-preview>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      <Link href={`/admin/orders/${r.id}`} className="font-semibold underline">
                        #{r.number}
                      </Link>{" "}
                      for {r.prospect ?? "?"} · {fmtDate(r.createdAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      {r.finishedPaid > 0 ? <span className="badge bg-green-50 text-green-700">finished: {r.finishedPaid} paid</span> : null}
                      <StatusBadge status={r.status} />
                    </span>
                  </div>
                  {r.status === "COMPLETED" && r.deliveredAt ? (
                    <div className="mt-2">
                      <CopyLink url={orderUrl(r)} label={`Link to send · the $39 offer runs until ${finishEndsAt(r.deliveredAt).toISOString().slice(0, 10)}`} hint={null} />
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Not delivered yet: the link is ready to send once the status says COMPLETED.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
