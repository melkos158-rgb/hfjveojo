import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="container-x max-w-xl py-24 text-center">
      <BrandMark size={64} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-gray-600">The link may have expired or the page moved.</p>
      <Link href="/tools" className="btn-primary mt-6">
        See all tools
      </Link>
    </div>
  );
}
