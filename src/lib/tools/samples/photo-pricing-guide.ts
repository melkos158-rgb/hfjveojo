import type { PricingGuideDoc } from "@/lib/render/pricingGuidePdf";
import type { SampleResult } from "@/lib/tools/types";

/**
 * A complete pricing guide for a fictional studio — the exact content of public/samples/photographer-pricing-guide-sample.pdf.
 * Regenerate the PDF after editing: `npx tsx scripts/render-samples.ts`.
 */
export const SAMPLE_PRICING_GUIDE: PricingGuideDoc = {
  brand: {
    studioName: "Ember & Oak Photography",
    photographerName: "Maya Torres",
    color: "#8a6d3b",
    website: "emberandoak.example",
    instagram: "@emberandoak",
    location: "Denver, Colorado",
  },
  coverTitle: "Wedding Collections 2026",
  tagline: "Honest, warm photographs of the day as it actually happened.",
  about:
    "Ember & Oak is Maya Torres — a Denver wedding photographer with eight seasons behind the camera and a soft spot for the in-between moments: the hand squeeze before the aisle, the grandmother who dances first. Every collection includes Maya as your lead photographer, an online gallery you can share, and print rights for all delivered images.",
  philosophy:
    "I shoot the way I would want my own wedding photographed: mostly unposed, a little directed when the light is worth it, and never rushed. You get a mix of wide, honest documentary frames and a handful of portraits you will actually want on the wall.",
  packages: [
    {
      name: "The Essentials",
      price: "$2,400",
      description: "Six hours of coverage for weddings with one location or a short timeline.",
      includes: ["6 hours of coverage with Maya", "400+ edited, full-resolution photos", "Online gallery with private sharing", "Print rights for personal use", "Delivery within 6 weeks"],
    },
    {
      name: "The Full Day",
      price: "$3,800",
      description: "Ten hours with a second shooter, from getting ready to the last dance.",
      includes: ["10 hours of coverage", "Second photographer", "700+ edited photos", "Sneak peek of 20 images within 72 hours", "Online gallery + print rights", "Delivery within 6 weeks"],
    },
  ],
  addOns: [
    { name: "Engagement session", price: "$450", description: "90 minutes at a location you love, 60+ edited photos. Great for save-the-dates." },
    { name: "Extra hour", price: "$350", description: "Added to any collection, before or on the day." },
    { name: "Heirloom album", price: "from $900", description: "10×10 lay-flat album, 30 pages, designed together after delivery." },
    { name: "Rush delivery", price: "$400", description: "Full gallery in 2 weeks instead of 6." },
  ],
  process: [
    { title: "Say hello", text: "Send a few details through the contact form. I reply within one business day with availability." },
    { title: "Book your date", text: "A signed agreement and a 30% retainer hold the date. The balance is due 30 days before the wedding." },
    { title: "Plan the day", text: "Six weeks out we build a photo timeline together so nothing important gets missed." },
    { title: "Wedding day", text: "I arrive early, work quietly, and keep the timeline honest." },
    { title: "Your gallery", text: "A sneak peek within 72 hours (Full Day) and the complete gallery within six weeks." },
  ],
  faq: [
    { q: "Do you travel?", a: "Yes. Anywhere in Colorado is included. Beyond that, travel is billed at cost and quoted up front." },
    { q: "How many photos will we get?", a: "At least 400 with The Essentials and 700 with The Full Day — usually more. Every delivered photo is edited by hand." },
    { q: "Can we print the photos ourselves?", a: "Yes. You receive full-resolution files with print rights for personal use." },
    { q: "What if it rains?", a: "Some of my favourite photos happened in bad weather. We plan a covered option for portraits and keep going." },
    { q: "Do you offer payment plans?", a: "Yes — the balance can be split into monthly payments after the retainer." },
  ],
  policies: [
    "A 30% non-refundable retainer and a signed agreement reserve your date.",
    "The remaining balance is due 30 days before the wedding.",
    "Galleries stay online for 12 months; downloads are unlimited during that time.",
    "Images may appear in my portfolio unless you ask for a private gallery.",
  ],
  cta: "Ready to talk about your day? Send a note through the website — I would love to hear your plans.",
};

const g = SAMPLE_PRICING_GUIDE;

export const SAMPLE_PRICING_GUIDE_RESULT: SampleResult = {
  label: "Sample guide for a fictional Denver wedding studio",
  input: [
    "Studio: Ember & Oak Photography · Maya Torres · Denver, CO",
    "Genre: weddings · voice: warm · brand colour #8a6d3b",
    "The Essentials | $2,400 | 6 hours, 400+ edited photos",
    "The Full Day | $3,800 | 10 hours, second shooter",
    "Add-ons: engagement session $450, extra hour $350, album from $900, rush $400",
    "Retainer 30%, balance 30 days before, galleries online 12 months",
  ],
  preview: {
    image: "/img/sample-pricing-guide.webp",
    alt: "Cover and packages pages of the sample pricing guide PDF",
    width: 1400,
    height: 996,
    href: "/samples/photographer-pricing-guide-sample.pdf",
    downloadLabel: "Open the sample PDF (5 pages)",
  },
  output: [
    { heading: `Cover — ${g.coverTitle}`, text: g.tagline },
    { heading: "About", text: g.about },
    { heading: "Packages", bullets: g.packages.map((p) => `${p.name} — ${p.price}: ${p.description}`) },
    { heading: "Add-ons", bullets: g.addOns.map((a) => `${a.name} — ${a.price}. ${a.description}`) },
    { heading: "What happens next", bullets: g.process.map((p) => `${p.title}: ${p.text}`) },
    { heading: "FAQ + policies", bullets: [...g.faq.map((f) => `${f.q} ${f.a}`), ...g.policies] },
  ],
  collapseAfter: 3,
  note: "Your prices are copied exactly as you typed them. The PDF uses your brand colour, studio name and contact details.",
};
