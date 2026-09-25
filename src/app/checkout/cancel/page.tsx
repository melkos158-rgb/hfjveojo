import Link from "next/link";

type Props = { searchParams: Promise<{ tool?: string }> };

export default async function CheckoutCancelPage({ searchParams }: Props) {
  const { tool } = await searchParams;
  return (
    <div className="container-x max-w-2xl py-16">
      <div className="card">
        <h1 className="text-2xl font-bold">Checkout cancelled</h1>
        <p className="mt-3 text-gray-700">No charge was made. Your answers are not saved yet — you can go back and order whenever you&apos;re ready.</p>
        <div className="mt-6 flex gap-3">
          <Link href={tool ? `/tools/${tool}#order` : "/tools"} className="btn-primary">
            Back to the order form
          </Link>
          <Link href="/contact" className="btn-secondary">
            Ask a question first
          </Link>
        </div>
      </div>
    </div>
  );
}
