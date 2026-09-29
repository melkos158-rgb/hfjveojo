import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

const SLUG = "photography-pricing-guide-checklist";
const TITLE = "What to put in a photography pricing guide: a checklist";
/** Search-result title: the checklist framing people search for ("what to include in a photography pricing guide"). */
const SEO_TITLE = "Photography pricing guide checklist: 8 sections to include";
const DESCRIPTION =
  "The 8 sections a photography pricing guide needs, what to write in each, and how to check your prices first. Packages, add-ons, process, booking terms, FAQ.";
const PUBLISHED = "2026-09-29";
const OG_IMAGE = "/img/hero-photographers.jpg";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${SEO_TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: OG_IMAGE, width: 900, height: 503 }] },
};

/** Our checklist (editorial recommendations, not survey data): the sections, in the order a client reads them. */
const SECTIONS: Array<{ name: string; include: string; tip: string }> = [
  {
    name: "Cover",
    include: "Studio name, the kind of work the guide covers (for example \"Weddings 2027\"), how to reach you, and the season or year the prices apply to.",
    tip: "Dating the cover lets you raise prices next year without arguing about an old PDF.",
  },
  {
    name: "About you",
    include: "Three or four sentences in the first person: who you are, how you work on the day, what clients end up with. One photo of you.",
    tip: "Clients book a person. Skip the equipment list.",
  },
  {
    name: "Packages",
    include: "For each package: hours of coverage, number of photographers, how many edited photos (a range is fine), delivery time, what is included (online gallery, downloads, print rights) and the exact price.",
    tip: "If two packages differ by a single item, merge them and sell that item as an add-on.",
  },
  {
    name: "Add-ons",
    include: "Everything that changes the price, each with its price: extra hour, second photographer, engagement or family session, album, prints, rush delivery, travel beyond a set distance.",
    tip: "A price next to every extra saves a round of emails per inquiry.",
  },
  {
    name: "Your process",
    include: "The steps from inquiry to delivery, with the time frames you actually keep: consultation, contract and retainer, planning, the shoot, a preview, the final gallery.",
    tip: "Promise the delivery time you hit on a busy month, not on a quiet one.",
  },
  {
    name: "Booking terms",
    include: "Retainer, payment schedule, travel fees, rescheduling and cancellation.",
    tip: "Restate what your contract says. The guide explains the terms; it does not replace the contract.",
  },
  {
    name: "FAQ",
    include: "The four to six questions you get most: how many photos, when they arrive, raw files, printing rights, what happens if it rains.",
    tip: "Copy them from your last ten inquiry emails, not from a template.",
  },
  {
    name: "Next step",
    include: "One clear action: reply with your date, or book a call at a link. Say how long you hold a date once someone asks.",
    tip: "End on the action, not on a thank-you page.",
  },
];

/** E10 guide for photographers: a practical checklist that leads to the free calculator and the $29 pricing-guide tool. */
export default function PricingGuideChecklist() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}${OG_IMAGE}`,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <p className="eyebrow">Guide · Photographers</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> a pricing guide is the document you send after an inquiry. It should answer what a
        client asks before booking — what each package includes, what it costs, what the extras cost and how booking works —
        so the next message is a date, not another question. Eight sections cover it: <strong>cover, about, packages,
        add-ons, process, booking terms, FAQ and next step</strong>. Keep it to four to six pages, make one guide per type of
        work, and check that every price covers your costs before you send it.
      </p>

      <h2>Before you write: check your prices</h2>
      <p>
        A well-designed guide with prices that do not cover your time is still a problem. Work out your floor first: what
        each job has to earn once editing, admin, business costs and tax are counted. The{" "}
        <Link href="/free/photography-pricing-calculator">free photography pricing calculator</Link> does that from your
        income goal and the real hours per job, with starting points for real estate, wedding and portrait work.
      </p>
      <p>
        For context on weddings: The Knot&apos;s 2026 Real Weddings Study, which surveyed 10,474 US couples married in 2025,
        puts the average cost of a wedding photographer at <strong>$3,000</strong>, with regional averages from $2,600 in the
        Southwest to $3,800 in the Mid-Atlantic. If your floor is above what your market pays, the fix is fewer hours per
        job or a different kind of work, not a nicer PDF.
      </p>

      <h2>The checklist: 8 sections</h2>
      <p>Our recommendation, in the order a client reads the guide:</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Section</th>
              <th className="py-2 pr-3">What to include</th>
              <th className="py-2">Tip</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s, i) => (
              <tr key={s.name} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-semibold whitespace-nowrap">
                  {i + 1}. {s.name}
                </td>
                <td className="py-2 pr-3">{s.include}</td>
                <td className="py-2 text-gray-600">{s.tip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Mistakes that cost bookings</h2>
      <ul>
        <li>
          <strong>Prices that disagree with your website.</strong> If the guide says one number and your site another, the
          client has to ask which one is real before they can book.
        </li>
        <li>
          <strong>&ldquo;Starting at&rdquo; and nothing else.</strong> A guide with only starting prices leaves the client
          with the question the guide was meant to answer.
        </li>
        <li>
          <strong>Too many near-identical packages.</strong> Two to four packages that clearly differ are easier to choose
          from than six that differ by one item.
        </li>
        <li>
          <strong>No date.</strong> An undated PDF keeps circulating long after your prices change.
        </li>
        <li>
          <strong>One guide for everything.</strong> Wedding clients and headshot clients need different packages and
          different answers. Make one guide per kind of work.
        </li>
      </ul>

      <h2>Make it with ORVIONIS</h2>
      <p>
        <Link href="/tools/photographer-pricing-guide">ORVIONIS Photographer Pricing Guide</Link> turns your answers to ten
        questions into a branded five-page PDF: cover, about page, packages with prices, add-ons, process, FAQ and policies,
        in your brand color and in your voice. Prices are copied exactly from what you enter; nothing is invented. It costs
        $29 once, with no subscription, and is usually ready in a few minutes.
      </p>
      <p>
        <Link href="/tools/photographer-pricing-guide" className="btn-primary no-underline">
          Build my pricing guide — $29
        </Link>{" "}
        <Link href="/tools/photographer-pricing-guide#example" className="btn-secondary no-underline">
          See the sample PDF
        </Link>
      </p>

      <h2>Sources</h2>
      <ul className="text-sm">
        <li>
          The Knot, &ldquo;Average cost of a wedding photographer&rdquo; (updated May 8, 2026): 2026 Real Weddings Study,
          10,474 US couples married in 2025; average $3,000; regional averages:{" "}
          <a href="https://www.theknot.com/content/average-cost-wedding-photographer" rel="nofollow noopener" target="_blank">
            theknot.com
          </a>
        </li>
        <li>The eight-section checklist and the tips are our own recommendations, not survey results.</li>
      </ul>
    </div>
  );
}
