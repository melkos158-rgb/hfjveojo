import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/components/admin/Kpi";
import { markFeedbackHandledAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminFeedback() {
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { order: { include: { tool: true } } } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Feedback</h1>
      <p className="mt-1 text-sm text-gray-600">Every response feeds the daily report. Handle it, then mark it handled.</p>
      <div className="mt-4 space-y-3">
        {items.map((f) => (
          <div key={f.id} className={`card ${f.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>
                {fmtDate(f.createdAt)} · {f.email ?? "—"} ·{" "}
                {f.order ? (
                  <Link href={`/admin/orders/${f.order.id}`} className="underline">
                    #{f.order.number} {f.order.tool.name}
                  </Link>
                ) : (
                  <>
                    {f.source === "tool_request" ? <span className="badge bg-blue-50 text-blue-700">tool request</span> : f.source}
                    {f.tags.length ? <span className="ml-2">{f.tags.join(" · ")}</span> : null}
                  </>
                )}
              </span>
              <span className="text-accent">{f.rating ? "★".repeat(f.rating) : "no rating"}</span>
            </div>
            <p className="mt-2 text-sm">{f.text}</p>
            {!f.handled ? (
              <form action={markFeedbackHandledAction} className="mt-2">
                <input type="hidden" name="id" value={f.id} />
                <button className="btn-secondary px-3 py-1.5" type="submit">
                  Mark handled
                </button>
              </form>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-gray-500">No feedback yet.</p> : null}
      </div>
    </div>
  );
}
