import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalNotice } from "@/components/LegalNotice";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

/**
 * Every statement on this page describes what the production code and configuration actually do (audit 2026-09-26,
 * docs/LEGAL_FLAGS.md). Change the page together with the behaviour it describes; legal identity stays in
 * src/config/site.ts (placeholders marked VERIFY keep the draft banner visible).
 */
const days = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

export default function PrivacyPage() {
  const outputDays = days(process.env.FILE_RETENTION_DAYS_OUTPUT, 90);
  const inputDays = days(process.env.FILE_RETENTION_DAYS_INPUT, 30);
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
          <strong>Orders</strong> — your email address, your name, the answers in the order form (for example property
          details, your name, brokerage or social handle as you want them on the result, or your business details), the
          photos and logos you upload and any links to your footage. We use them to produce and deliver your order
          (performance of the contract). Each order has a private link to its status and files; we email it to you.
        </li>
        <li>
          <strong>Payments</strong> — you pay on Stripe&apos;s checkout page. Your full card number and security code go to
          Stripe, never to us. Stripe tells us the payment status, amount, currency, fee and a receipt link. We keep
          Stripe&apos;s notifications about your payment; they contain the name, email address and billing details you gave
          Stripe and, for refunds or failed payments, the card brand, last four digits, expiry date and issuing country.
          Stripe emails you a receipt that includes your private order link. Stripe processes the payment itself under its
          own privacy policy.
        </li>
        <li>
          <strong>Account and sign-in</strong> — your email address, your name and the time of your last sign-in. You can
          sign in with an emailed link or with Google; with Google we ask only for your basic profile (name and verified
          email address) and do not store your profile picture.
        </li>
        <li>
          <strong>Messages and feedback</strong> — what you write in the contact / tool-request form (plus your email
          address if you give it) and the rating and comments you leave on an order. We use them to reply and to improve
          the service; new requests are emailed to our team.
        </li>
        <li>
          <strong>Usage data</strong> — our own first-party analytics: the pages you view, the site that referred you
          (the site only, not the full address), campaign parameters (utm), the page you first landed on, the Google Ads
          click identifier and click time when you arrive from one of our ads, a random visit ID, your browser&apos;s
          user-agent string and a hash of your IP address (see below). If you sign in or order, these events are linked to
          your account or order. We use this to see which pages and channels bring customers and to keep the service
          working.
        </li>
        <li>
          <strong>IP addresses</strong> — we use your IP address to limit abuse (for example sign-in attempts, uploads and
          free previews per connection). We store it only as a keyed one-way hash, never the address itself. Our hosting
          provider also processes IP addresses to route traffic to the site.
        </li>
        <li>
          <strong>Free tools</strong> — the fair-housing checker and the pricing calculator run in your browser; what you
          type there is not sent to us.
        </li>
        <li>
          <strong>Marketplace orders</strong> — if you order one of our services on a marketplace such as Fiverr, we receive
          the photos and instructions you send there and process them in the same way. The marketplace&apos;s own privacy
          policy covers your account and payment there.
        </li>
      </ul>

      <h2>AI processing</h2>
      <p>
        We use OpenAI to create deliverables. We send it the answers in your order form, the photos you upload for virtual
        staging (rotated and resized first) and the generated text for an automated quality check. If you ask for a free
        staging preview, your photo is sent to OpenAI before you pay; the watermarked preview comes back to your browser
        and is not stored. Once a day we also send OpenAI aggregate business numbers together with up to five recent
        unanswered feedback messages (shortened) to write an internal summary. We do not send your email address or payment
        details to AI providers. OpenAI processes this content under its API data-processing terms. We do not use your data
        to train AI models.
      </p>

      <h2>Virtual staging disclosure page</h2>
      <p>
        For virtual staging orders we create a page that shows your original, unaltered photos, so buyers can see the room
        as it is (for example for California AB 723 disclosures). Its address contains a long random code, it is excluded
        from search engines and linked only from your deliverables (including a QR code). Anyone who has the link can view
        it until the original photos are deleted (see Retention).
      </p>

      <h2>Advertising measurement</h2>
      <p>
        When you arrive from one of our Google ads, Google adds a click identifier (gclid) to the link. We keep it in a
        first-party cookie and with your order. If you then buy, we may upload that purchase to Google Ads so we can see
        whether our ads work: only the click identifier, the conversion name, the time of purchase, the amount and the
        currency — never your name, email address or files. We do not place Google&apos;s advertising tag or advertising
        cookies on this site.
      </p>

      <h2>Google Analytics</h2>
      <p>
        Google Analytics 4 is built into the site but is currently switched off. If we switch it on, the cookie notice will
        offer &ldquo;Accept Google Analytics&rdquo; and &ldquo;Decline&rdquo;. In the EEA, the UK and Switzerland Google
        Analytics cookies are then set only after you accept; before that Google may receive cookieless measurement
        requests. Elsewhere analytics is on by default and you can decline it. Advertising storage and ad personalisation
        stay off, Google signals is off, page addresses are cleaned of order links, and purchase events contain only the
        order ID, amount and product — never your name, email address or order links.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>
          Uploaded photos and logos are deleted {inputDays} days after upload. If you use them in an order, we keep them for{" "}
          {outputDays} days from the order so the order page (before/after) and the disclosure page keep working, then delete
          them.
        </li>
        <li>Delivered files (for example images, PDFs and text files) are deleted {outputDays} days after they were created. ZIP downloads are built on request and not stored.</li>
        <li>Expired files are removed by an automatic job that runs every hour.</li>
        <li>Rate-limit counters (which contain only IP hashes) are deleted after about 24 hours.</li>
        <li>
          Order records (including your form answers and any text results), payment records and Stripe notifications,
          account data, messages and feedback, and usage events are not deleted automatically at the moment. We keep them
          to run the service and for accounting, tax and dispute purposes. Ask us at {site.supportEmail} to delete data we
          are not required to keep.
        </li>
      </ul>

      <h2>Cookies and similar storage</h2>
      <ul>
        <li><code>orv_session</code> — keeps you signed in; until you sign out or the session expires.</li>
        <li><code>orv_google_state</code> — protects Google sign-in; 10 minutes, only during sign-in.</li>
        <li><code>orv_auth_evt</code> — notes that you just signed in so Google Analytics can count it when it is on; 60 seconds.</li>
        <li><code>orv_attr</code> — how you found us (campaign parameters, referring site, landing page and, from our ads, the click identifier); 90 days.</li>
        <li><code>orv_sid</code> — a random visit ID for our own statistics; 180 days.</li>
        <li><code>orv_internal</code> — set only on our own team&apos;s devices to keep them out of the statistics.</li>
        <li>
          Browser storage: <code>orv_consent</code> (you closed the cookie notice), <code>orv_analytics</code> (your Google
          Analytics choice) and <code>orv_ga_*</code> markers (so a purchase is reported to Google Analytics only once) —
          the last two only while Google Analytics is on.
        </li>
        <li><code>_ga</code>, <code>_ga_*</code> — Google Analytics cookies, only while it is on and, in the EEA, the UK and Switzerland, only after you accept.</li>
      </ul>
      <p>
        The first-party cookies above are set for every visitor; the cookie notice choice covers Google Analytics only.
        Stripe and Google set their own cookies on their checkout and sign-in pages. You can delete cookies in your browser
        at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live you may have the right to access, correct, delete or export your data, or object to its
        processing. Email {site.supportEmail} and we will respond within the statutory period. You may also lodge a complaint
        with your local data-protection authority.
      </p>

      <h2>Processors and other recipients</h2>
      <p>
        Railway (hosting and database; our application runs in Railway&apos;s EU West region), Stripe (payments), OpenAI (AI
        generation), Resend (transactional email), Google (sign-in with Google, Google Ads purchase measurement for visitors
        who came from our ads, and Google Analytics only if we switch it on) and Namecheap (forwards email sent to{" "}
        {site.supportEmail}). Marketplaces such as Fiverr act under their own terms when you order there.
      </p>
      <p>
        Some of these providers are based in the United States, so your data may be processed there. Safeguards:{" "}
        {site.legal.transfersNote}.
      </p>
    </div>
  );
}
