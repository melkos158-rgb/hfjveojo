import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { RoomGallery } from "@/components/RoomGallery";
import { ROOM_EXAMPLES } from "@/content/room-examples";

const SLUG = "which-rooms-to-virtually-stage";
const TITLE = "Which rooms should you virtually stage?";
/** Search-result title: the answer's source up front (agents search "which rooms to stage"). */
const SEO_TITLE = "Which rooms to stage first: what 2025 NAR data says";
const DESCRIPTION =
  "Buyers' agents rank the living room (37%), the primary bedroom (34%) and the kitchen (23%) as the rooms that matter most to stage. A room-by-room plan for one to six photos, and what to skip.";
const PUBLISHED = "2026-09-28";
/** 5 Oct 2026: real before/after results by room from the 3 Oct lab test. */
const MODIFIED = "2026-10-05";
const OG_IMAGE = "/img/sample-virtual-staging-og.jpg";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${SEO_TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: OG_IMAGE, width: 540, height: 630 }] },
};

/** NAR 2025 Profile of Home Staging (survey of Realtors, February 2025) — see Sources. */
const BUYERS_AGENTS: Array<{ room: string; share: string }> = [
  { room: "Living room", share: "37%" },
  { room: "Primary bedroom", share: "34%" },
  { room: "Kitchen", share: "23%" },
  { room: "Guest bedroom", share: "7%" },
];
const SELLERS_AGENTS: Array<{ room: string; share: string }> = [
  { room: "Living room", share: "91%" },
  { room: "Primary bedroom", share: "83%" },
  { room: "Dining room", share: "69%" },
  { room: "Kitchen", share: "68%" },
  { room: "Guest bedroom / children's bedroom", share: "22% each" },
];

/** Our recommendation (not NAR's): the order in which to add rooms as the photo budget grows. */
const PLAN: Array<{ photos: string; rooms: string; why: string }> = [
  { photos: "1 photo", rooms: "Living room", why: "Ranked most important by buyers' agents, and usually the lead photo of the listing." },
  { photos: "2 photos", rooms: "+ Primary bedroom", why: "A close second (34%) — the room buyers imagine themselves in." },
  { photos: "3–4 photos", rooms: "+ Dining area, + kitchen if it has space for a table or stools", why: "Sellers' agents stage the dining room (69%) and kitchen (68%) almost as often as the bedroom. A kitchen full of cabinets needs little more than stools and decor." },
  { photos: "5–6 photos", rooms: "+ A second bedroom as a home office, + the patio", why: "An empty spare room reads as \"what is this for?\"; a desk answers it. An outdoor seating area shows the space can be used." },
];

/** Data-backed E10 guide: which rooms to stage, from NAR's 2025 survey; the plan is marked as our own recommendation. */
export default function WhichRoomsGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}${OG_IMAGE}`,
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> start with the <strong>living room</strong>, then the <strong>primary bedroom</strong>,
        then the <strong>dining area or kitchen</strong>. In the National Association of REALTORS® 2025 Profile of Home
        Staging, buyers&apos; agents named the living room (37%), the primary bedroom (34%) and the kitchen (23%) as the most
        important rooms to stage; the guest bedroom came last (7%). If you only stage a few photos, spend them there.
      </p>

      <h2>What the 2025 NAR survey says</h2>
      <div className="not-prose grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Most important to stage (buyers&apos; agents)</p>
          <table className="mt-2 w-full text-left text-sm">
            <tbody>
              {BUYERS_AGENTS.map((r) => (
                <tr key={r.room} className="border-t border-line">
                  <td className="py-2 pr-3">{r.room}</td>
                  <td className="py-2 text-right">{r.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-sm font-semibold">Rooms they stage (sellers&apos; agents)</p>
          <table className="mt-2 w-full text-left text-sm">
            <tbody>
              {SELLERS_AGENTS.map((r) => (
                <tr key={r.room} className="border-t border-line">
                  <td className="py-2 pr-3">{r.room}</td>
                  <td className="py-2 text-right">{r.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p>
        The survey went to Realtors in February 2025 (1,266 usable responses). It covers staging in general, physical or
        virtual. The same report shows why the photos deserve the effort: photos were the listing-marketing element agents
        most often called important — 88% of sellers&apos; agents and 73% of buyers&apos; agents.
      </p>

      <h2>A plan for one to six photos</h2>
      <p>Our recommendation, built on the ranking above — add rooms in this order as your budget allows:</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Photos</th>
              <th className="py-2 pr-3">Rooms</th>
              <th className="py-2">Why</th>
            </tr>
          </thead>
          <tbody>
            {PLAN.map((p) => (
              <tr key={p.photos} className="border-t border-line align-top">
                <td className="py-2 pr-3 whitespace-nowrap">{p.photos}</td>
                <td className="py-2 pr-3">{p.rooms}</td>
                <td className="py-2">{p.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="real-results" className="scroll-mt-20">What each room looks like staged</h2>
      <p>
        Five rooms we ran through ORVIONIS in October 2026, using free-licence stock photos of empty rooms. Each staged
        photo is the model&apos;s output, unedited; the empty photo is cropped to the same frame. Tap a room to compare.
      </p>
      <RoomGallery rooms={ROOM_EXAMPLES} />
      <p>
        What gets added depends on the room. Kitchens get stools or a small table and a little counter decor, while the
        cabinets, appliances and ceiling lights stay where they are. Bathrooms get accessories: towels, a mat, a tray and a
        plant. In every room the walls, windows, doors and fixtures stay as photographed.
      </p>
      <p className="text-xs text-gray-500">
        Empty-room photos: Pexels, free licence (photos {ROOM_EXAMPLES.map((r) => r.pexelsId).join(", ")}). Staged by ORVIONIS.
      </p>

      <h2>Rooms to skip, or to handle differently</h2>
      <ul>
        <li>
          <strong>Guest and children&apos;s bedrooms.</strong> Only 7% of buyers&apos; agents ranked the guest bedroom as the most
          important room. Stage it last, or as a home office, which tells buyers what the extra room is good for.
        </li>
        <li>
          <strong>Bathrooms.</strong> There is little furniture to add, so bathroom staging adds accessories only: towels, a bath mat, a plant and a little decor. A clean, bright photo still does most of the work.
        </li>
        <li>
          <strong>Rooms that aren&apos;t empty.</strong> Virtual staging adds furniture to empty rooms. Leftover furniture and
          clutter have to be removed first — in the room or in the photo — or the staging will look wrong.
        </li>
        <li>
          <strong>Dark or tilted photos.</strong> Reshoot them before paying for staging — see{" "}
          <Link href="/guides/photographing-rooms-for-virtual-staging">10 tips for room photos that stage well</Link>.
        </li>
      </ul>

      <h2>Keep the listing consistent</h2>
      <ul>
        <li>
          Use one style for the whole listing, so the rooms look like one home rather than a catalog. Not sure which one? See{" "}
          <Link href="/guides/virtual-staging-styles">the six styles on one room</Link>.
        </li>
        <li>Put the staged living room first in the photo order — it is the room buyers&apos; agents rank highest.</li>
        <li>
          Disclose the staging. Most MLSs require it, and in California AB 723 also requires access to the original photo —
          see the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>.
        </li>
        <li>
          Budget per photo, not per listing: see <Link href="/guides/virtual-staging-cost">what virtual staging costs in 2026</Link>.
        </li>
      </ul>

      <h2>Staging several rooms with ORVIONIS</h2>
      <p>
        <Link href="/tools/virtual-staging">ORVIONIS Virtual Staging</Link> takes up to ten room photos per order: $15 per
        photo, $12 each from five photos, $99 for ten. You set the room type of each photo (living room, bedroom, dining room, home office, kitchen, bathroom, patio), pick one of
        six styles for the whole order, and get two staged versions of every photo in about two minutes per photo — walls,
        floors and windows stay as photographed. Every order includes labeled copies for the MLS disclosure, and your first
        photo is free.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>Sources</h2>
      <ul className="text-sm">
        <li>
          National Association of REALTORS®, &ldquo;NAR Report Reveals Home Staging Boosts Sale Prices and Reduces Time on
          Market&rdquo; (May 6, 2025) — room rankings, marketing elements, survey method:{" "}
          <a href="https://www.nar.realtor/press-releases/nar-report-reveals-home-staging-boosts-sale-prices-and-reduces-time-on-market" rel="nofollow noopener" target="_blank">
            nar.realtor
          </a>
        </li>
        <li>
          NAR, Profile of Home Staging (research report page):{" "}
          <a href="https://www.nar.realtor/research-and-statistics/research-reports/profile-of-home-staging" rel="nofollow noopener" target="_blank">
            nar.realtor
          </a>
        </li>
      </ul>
    </div>
  );
}
