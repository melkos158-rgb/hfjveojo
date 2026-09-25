export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    PAID: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    RETRYING: "bg-amber-50 text-amber-700",
    REVIEW: "bg-amber-50 text-amber-800",
    COMPLETED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-600",
    CANCELED: "bg-gray-100 text-gray-500",
    LIVE: "bg-green-50 text-green-700",
    VALIDATING: "bg-blue-50 text-blue-700",
    PAUSED: "bg-amber-50 text-amber-700",
    DRAFT: "bg-gray-100 text-gray-600",
    DEPRECATED: "bg-gray-100 text-gray-500",
    RUNNING: "bg-blue-50 text-blue-700",
    WON: "bg-green-50 text-green-700",
    LOST: "bg-red-50 text-red-700",
    PLANNED: "bg-gray-100 text-gray-600",
    QUEUED: "bg-gray-100 text-gray-700",
    DONE: "bg-green-50 text-green-700",
  };
  return <span className={`badge ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

export function fmtDate(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "—";
}
