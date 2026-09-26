import type { SampleResult } from "@/lib/tools/types";

/** Clip plan + captions for a fictional Austin listing — the text part of the deliverable (clips are cut by the editor from your walkthrough). */
export const SAMPLE_LISTING_CLIPS_RESULT: SampleResult = {
  label: "Sample plan for a fictional 3-bed in Austin, Texas",
  input: [
    "1420 Oak Hill Dr, Austin, TX · $549,000 · 3 bd · 2.5 ba",
    "Renovated kitchen with quartz island; covered patio; primary suite with soaking tub; oak-shaded corner lot",
    "4-minute phone walkthrough (Drive link) · style: cinematic · music: chill",
    "Agent: Jordan Lee · open house Sunday 2–4",
  ],
  output: [
    {
      heading: "Clip 1 — The kitchen everyone will stand in (12 s)",
      bullets: [
        "Hook: “The island is 9 feet long. Yes, we measured.”",
        "Shots: slow push-in on the island from the walkthrough (0:41–0:49), cut to the pantry door opening (1:05–1:08)",
        "On-screen: $549,000 → 3 bd · 2.5 ba → Renovated 2024",
        "Caption: Nine feet of quartz and a pantry you can walk into. 1420 Oak Hill Dr, Austin — open Sunday 2–4.",
      ],
    },
    {
      heading: "Clip 2 — Covered patio, 7 pm light (10 s)",
      bullets: [
        "Hook: “Where the evenings happen.”",
        "Shots: doors sliding open (2:10–2:14), pan across the patio to the oaks (2:15–2:21)",
        "On-screen: Covered patio → Oak-shaded corner lot",
        "Caption: Covered patio, corner lot, old oaks doing the work. Open house Sunday 2–4 at 1420 Oak Hill Dr.",
      ],
    },
    {
      heading: "Clip 3 — Primary suite + soaking tub (9 s)",
      bullets: [
        "Hook: “The bath that sells the house.”",
        "Shots: bedroom reveal (2:48–2:52), tub close-up with the window light (3:01–3:06)",
        "On-screen: Primary suite → Soaking tub",
        "Caption: Primary suite with a soaking tub under the window. 3 bd · 2.5 ba · $549,000.",
      ],
    },
    {
      heading: "Clip 4 — The whole house in 15 seconds (15 s)",
      bullets: [
        "Hook: “Full tour. No talking. 15 seconds.”",
        "Shots: 8 quick cuts, 1.5–2 s each, in walkthrough order; speed-ramp on the kitchen and patio",
        "On-screen: price and stats on the first frame, agent name and open house on the last",
        "Caption: 1420 Oak Hill Dr in 15 seconds. Renovated kitchen, covered patio, primary suite with a soaking tub. Open Sunday 2–4.",
      ],
    },
    {
      heading: "Clip 5 — Open house reminder (8 s)",
      bullets: [
        "Hook: “Sunday. 2 to 4. Bring your questions.”",
        "Shots: exterior from the corner (0:03–0:08) with the address overlay",
        "On-screen: Open house Sunday 2–4 → 1420 Oak Hill Dr → Jordan Lee",
        "Caption: Open house this Sunday 2–4 at 1420 Oak Hill Dr. Message me for a private showing if you can’t make it.",
      ],
    },
    { heading: "Hashtags", text: "#AustinRealEstate #JustListed #AustinHomes #OpenHouse #TexasHomes #RenovatedKitchen #HomeTour #ATX" },
    {
      heading: "Editor notes",
      text: "Cinematic: 24 fps look, gentle speed ramps, chill lo-fi track under −18 dB. Burn captions in for sound-off viewing; keep the price overlay on for the first 2 seconds of every clip. Brand watermark bottom-left.",
    },
  ],
  collapseAfter: 2,
  note: "You get the five finished clips as MP4 download links (9:16, captions burnt in) plus this plan, the captions and the hashtags. A person cuts the clips; the plan is drafted the minute you pay.",
};
