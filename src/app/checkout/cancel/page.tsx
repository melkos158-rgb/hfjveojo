import Link from "next/link";

type Props = { searchParams: Promise<{ tool?: string; order?: string; t?: string }> };

export default async function CheckoutCancelPage({ searchParams }: Props) {
  const { tool, order, t } = await searchParams;
  // The order, its photos and its price are kept: the same order can be paid in a new checkout (resume link).
  const resume = order && t ? `/api/orders/${encodeURIComponent(order)}/resume?t=${encodeURIComponent(t)}` : null;
  return (
    <div className="container-x max-w-2xl py-16">
      <div className="card">
        <h1 className="text-2xl font-bold">Checkout cancelled</h1>
        <p className="mt-3 text-gray-700">
          No charge was made.{" "}
          {resume
            ? "Your photos and choices are saved for 24 hours: you can finish the same order whenever you're ready."
            : "Your answers are not saved yet — you can go back and order whenever you're ready."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {resume ? (
            <a href={resume} className="btn-primary" data-resume>
              Finish my order
            </a>
          ) : null}
          <Link href={tool ? `/tools/${tool}#order` : "/tools"} className={resume ? "btn-secondary" : "btn-primary"}>
            {resume ? "Start a new order" : "Back to the order form"}
          </Link>
          <Link href="/contact" className="btn-secondary">
            Ask a question first
          </Link>
        </div>
      </div>
    </div>
  );
}
