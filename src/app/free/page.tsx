import type { Metadata } from "next";
import Link from "next/link";
import { FREE_TOOLS } from "@/config/free-tools";

export const metadata: Metadata = {
  title: "Free tools",
  description: "Small, useful tools that run in your browser: a fair-housing checker for listing copy and a photography pricing calculator. No sign-up.",
  alternates: { canonical: "/free" },
};

export default function FreeToolsPage() {
  return (
    <div className="container-x py-14">
      <p className="eyebrow">Free tools</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Useful on their own. No sign-up.</h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-700">Each one runs in your browser and does one job well. If you then want the finished deliverable, the paid tool is one click away.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {FREE_TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card block transition hover:border-accent/50">
            <span className="badge bg-green-50 text-green-700">{t.audience}</span>
            <h2 className="mt-3 text-lg font-bold text-fg">{t.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{t.description}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-accent">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
