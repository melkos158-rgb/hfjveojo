import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalNotice } from "@/components/LegalNotice";

export const metadata: Metadata = { title: "Refund Policy", alternates: { canonical: "/refund-policy" } };

export default function RefundPolicyPage() {
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <h1>Refund Policy</h1>
      <p>Last updated: {site.legal.lastUpdated}</p>
      <LegalNotice />
      <h2>The short version</h2>
      <p>If we do not deliver what the tool page promised, you get your money back. If we deliver it and you change your mind, you get a revision, not a refund.</p>
      <h2>Full refund</h2>
      <ul>
        <li>We fail to deliver within 2× the promised delivery window.</li>
        <li>The deliverable does not match the description on the tool page and we cannot fix it in one revision round.</li>
        <li>We cancel your order for any reason.</li>
        <li>First order of a concierge tool (for example Listing Clips): if you are not satisfied after one revision, tell us within 7 days of delivery.</li>
      </ul>
      <h2>Revision instead of refund</h2>
      <ul>
        <li>The deliverable matches the description but you would like changes — one revision round is included with every order.</li>
        <li>You provided incorrect inputs (wrong prices, wrong footage link). We will regenerate once at no charge if the fix takes minutes; larger re-dos may be charged as a new order.</li>
      </ul>
      <h2>How to request</h2>
      <p>
        Email {site.supportEmail} with your order number within 7 days of delivery. Approved refunds are returned to the original payment method via Stripe, typically within 5–10 business days depending on your bank.
      </p>
    </div>
  );
}
