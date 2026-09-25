import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return (
    <div className="container-x max-w-md py-16">
      <div className="card">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">No password. We email you a one-time link that signs you in and shows your orders.</p>
        {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
