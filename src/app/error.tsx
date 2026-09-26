"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";

/** Branded fallback for an unexpected error inside a page (the root layout — nav, footer — stays). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-x max-w-xl py-24 text-center">
      <BrandMark size={64} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-gray-600">Please try again. If it keeps happening, tell us at hello@orvionis.com{error.digest ? ` (reference ${error.digest})` : ""}.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
