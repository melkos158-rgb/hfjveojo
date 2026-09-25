import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Contact", description: `Questions about an order or a tool? Email ${site.supportEmail}.`, alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="container-x max-w-2xl py-12 prose-basic">
      <h1>Contact</h1>
      <p>
        Email <a className="underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>. Replies within one business day; order issues get priority.
      </p>
      <p>If you have an order number, include it — it lets us pull up your files immediately.</p>
      <h2>Want a tool that doesn&apos;t exist yet?</h2>
      <p>
        Tell us the job you keep paying for or putting off. Tools get built in the order people are willing to pay for them, and early requesters get the first version at the launch price.
      </p>
    </div>
  );
}
