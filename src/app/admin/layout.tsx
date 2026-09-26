import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/guards";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Overview"],
  ["/admin/orders", "Orders"],
  ["/admin/users", "Users"],
  ["/admin/tools", "Tools & prices"],
  ["/admin/experiments", "Experiments"],
  ["/admin/analytics", "Analytics"],
  ["/admin/ai-costs", "AI costs"],
  ["/admin/feedback", "Feedback"],
  ["/admin/content", "Content"],
  ["/admin/system", "System"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage("/admin");
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">AI CEO console</p>
            <p className="text-sm text-gray-600">{admin.email}</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-1.5 font-medium text-gray-700 hover:bg-mist hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
