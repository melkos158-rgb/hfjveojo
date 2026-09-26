import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

const TITLE = "How to photograph an empty room for virtual staging (10 tips)";
const DESCRIPTION =
  "Virtual staging can only be as good as the photo underneath it. Camera height, angle, lens, light and what to clear out — ten practical tips for room photos that stage realistically.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides/photographing-rooms-for-virtual-staging" },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/photographing-rooms-for-virtual-staging`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const TIPS: Array<{ title: string; text: string }> = [
  { title: "Shoot horizontal", text: "Landscape (3:2 or 4:3) gives the furniture room to breathe and matches how portals and the MLS display photos. Vertical shots crop the room and leave little floor to stage." },
  { title: "Camera at chest height, level", text: "Around 4–5 feet off the floor, with the camera level so walls and door frames stay vertical. A tilted camera makes staged furniture look like it is sliding." },
  { title: "Stand in a corner or doorway", text: "Show two or three walls and most of the floor. Furniture is placed on the floor you can see — if the floor is cut off, there is nowhere to put a sofa." },
  { title: "Wide, not fisheye", text: "Use your phone's normal 1× lens and step back into a corner. The 0.5× ultra-wide stretches the edges of the room, and stretched corners make staged furniture look warped." },
  { title: "Daylight, blinds open, lights on", text: "Shoot during the day with blinds open and the room's own lights switched on. Even light gives the model clean shadows to match; mixed hard sunlight and dark corners do not." },
  { title: "Turn on HDR", text: "Phone HDR keeps the window view and the room both readable. Blown-out windows are kept as they are — staging does not invent a view." },
  { title: "Clear everything that moves", text: "Boxes, cords, ladders, paint cans, shoes. Empty rooms stage best; leftover items either stay in the picture or get covered in odd ways." },
  { title: "Keep doors and windows in frame", text: "They anchor the room and are kept exactly as photographed, which is what makes the staged version believable (and honest)." },
  { title: "Big and sharp", text: "At least 2,000 pixels wide, in focus, as JPG under 8 MB. Don't send a screenshot of a photo." },
  { title: "One room, no people", text: "One room per photo, no people, pets or mirrors that show the photographer. Then label the staged result — see the AB 723 checklist for California." },
];

/** Practical photo guide for virtual staging inputs (better inputs → better outputs, fewer redos). */
export default function PhotographingRoomsGuide() {
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: TITLE,
    description: DESCRIPTION,
    step: TIPS.map((t, i) => ({ "@type": "HowToStep", position: i + 1, name: t.title, text: t.text })),
  };
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">How to photograph an empty room for virtual staging</h1>
      <p>
        Virtual staging keeps the walls, floor, windows and camera angle of your photo and adds furniture on top — so the result can only be as good as the photo underneath. These ten habits take a minute on site and make the difference between &ldquo;looks staged&rdquo; and &ldquo;looks real&rdquo;.
      </p>
      <ol>
        {TIPS.map((t) => (
          <li key={t.title}>
            <strong>{t.title}.</strong> {t.text}
          </li>
        ))}
      </ol>
      <h2>Then stage it</h2>
      <p>
        Upload the photo to <Link href="/tools/virtual-staging">Virtual Staging</Link>, pick the room and one of six styles, and get two staged versions of that exact photo in about two minutes — $15, with a free watermarked preview first and a disclosure pack for the MLS. Selling in California? Read the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage a photo — $15
        </Link>
      </p>
    </div>
  );
}
