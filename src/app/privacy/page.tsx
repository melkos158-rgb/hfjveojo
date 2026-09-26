import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalNotice } from "@/components/LegalNotice";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <h1>Privacy Policy</h1>
      <p>Last updated: {site.legal.lastUpdated}</p>
      <LegalNotice />
      <h2>Controller</h2>
      <p>
        {site.legal.entityName}, {site.legal.address}, {site.legal.country}. Contact: {site.supportEmail}.
      </p>
      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Order data</strong> — your email, name, the answers in the order form, uploaded logos and links to your footage. Needed to produce and deliver your order (contract performance).
        </li>
        <li>
          <strong>Payment data</strong> — processed by Stripe. We receive the payment status, amount and a receipt link; we never see full card numbers. Stripe&apos;s privacy policy applies to the payment itself.
        </li>
        <li>
          <strong>Account data</strong> — email and sign-in timestamps when you use a sign-in link.
        </li>
        <li>
          <strong>Usage data</strong> — first-party analytics: page views, which tool page you came from, campaign parameters (utm), the ad click identifier when you arrive from one of our Google ads (gclid), and an anonymous session id. IP addresses are stored only as a truncated hash for abuse prevention. If you buy after clicking one of our ads, we may report that purchase to Google Ads (the click identifier, time and amount — never your name, email or files) so we can tell whether our ads work. We may also use Google Analytics 4 to measure page views and conversions (e.g. checkout started, purchase with order number and amount) — never your name, email or order links. No advertising trackers, no ad personalisation, Google signals off.
        </li>
        <li>
          <strong>AI processing</strong> — the content of your order form is sent to our AI providers (currently OpenAI, and Anthropic as a fallback) to generate your deliverable, under their API data-processing terms. We do not use your data to train models.
        </li>
      </ul>
      <h2>Retention</h2>
      <p>
        Delivered files are kept for {process.env.FILE_RETENTION_DAYS_OUTPUT ?? "90"} days and uploaded inputs for {process.env.FILE_RETENTION_DAYS_INPUT ?? "30"} days, then deleted. Order records and invoices are kept as long as accounting and tax rules require.
      </p>
      <h2>Cookies</h2>
      <p>
        Essential cookies: a session cookie when you sign in, a first-visit attribution cookie (campaign parameters, and the ad click identifier when you arrive from one of our ads) and an anonymous session id. Analytics cookies (Google Analytics, <code>_ga</code>) only when enabled: in the EEA, the UK and Switzerland they are set only after you choose &ldquo;Accept analytics&rdquo;; elsewhere you can turn them off with &ldquo;Essential only&rdquo; in the cookie notice. You can delete all cookies in your browser at any time.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on where you live you may have the right to access, correct, delete or export your data, or object to its processing. Email {site.supportEmail} and we will respond within the statutory period. You may also lodge a complaint with your local data-protection authority.
      </p>
      <h2>Processors</h2>
      <p>Stripe (payments), Railway (hosting, EU/US regions), OpenAI and Anthropic (AI generation), Resend (transactional email), Google (Analytics, when enabled; Google Ads purchase measurement for visitors who came from our ads).</p>
    </div>
  );
}
