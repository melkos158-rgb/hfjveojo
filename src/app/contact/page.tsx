import type { Metadata } from "next";
import { site } from "@/config/site";
import { RequestForm } from "@/components/RequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & tool requests",
  description: `Questions about an order, or a result you would pay for that does not exist yet? Email ${site.supportEmail} or send a request.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr]">
      <div className="prose-basic">
        <h1>Contact</h1>
        <p>
          Email{" "}
          <a className="underline" href={`mailto:${site.supportEmail}`}>
            {site.supportEmail}
          </a>
          . Replies within one business day; order issues get priority.
        </p>
        <p>If you have an order number, include it — it lets us pull up your files immediately.</p>
        <h2>Want a result that does not exist yet?</h2>
        <p>
          Tell us the job you keep paying for or putting off. Tools get built in the order people ask for them, and early requesters get the first version at the launch
          price.
        </p>
      </div>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Request a tool</h2>
        <RequestForm topic={topic} />
      </div>
    </div>
  );
}
