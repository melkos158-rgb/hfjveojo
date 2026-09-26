# Fiverr gig — Virtual Staging (experiment E13)

This is ready to paste once the owner has a Fiverr seller account. Images: `docs/fiverr/gig-1-before-after.jpg` and `docs/fiverr/gig-2-what-you-get.jpg` (1280×769). Both are built from the real, unedited output of production order #6.

**Honesty rules:**
- Only real results in images.
- Answer "yes" to Fiverr's question whether the gig uses AI; the description says so plainly.
- Never move buyers or payments off Fiverr. That's against Fiverr's rules; the ORVIONIS site is not mentioned in the gig or in messages.

## Gig setup

| Field | Value |
| --- | --- |
| Title | I will do realistic virtual staging of your empty real estate photos |
| Category | Graphics & Design → Architecture & Interior Design → service type **Virtual Staging** |
| Metadata | project scale "Other: Individual rooms", building type Residential |
| Search tags | virtual staging, real estate, home staging, interior design, listing photos |
| Uses AI | Yes — "AI-assisted staging, checked by a person before delivery" |

## Packages

| | Basic | Standard | Premium |
| --- | --- | --- | --- |
| Name | 1 room | 3 rooms | 6 rooms (whole listing) |
| Description | 1 photo staged, 2 versions to choose from | 3 photos staged, 2 versions each | 6 photos staged, 2 versions each |
| Price | $10 | $25 | $45 |
| Delivery | 2 days | 2 days | 3 days |
| Revisions | 1 | 1 | 1 |
| Extras | labeled "Virtually staged" copies included | same | same |

**Economics:** Fiverr keeps 20 %, so the net is $8 / $20 / $36. The AI cost is ≈ $0.10 per photo, so the contribution is ≈ $7.90 / $19.70 / $35.40. Extra "Additional image": $10, +1 day. Fiverr only accepts prices in $5 steps.

**Price position:** gigs in the category start at €5–10 from Top Rated sellers with 1k+ reviews; new sellers charge €10–14. Our edge is speed plus two versions per photo. This is pricing hypothesis H1 in `docs/FIVERR_EXPERIMENT.md`; review it after 14 days or 300 impressions.

## Description (max 1,200 characters)

> Empty rooms make listings look cold. I stage your room photos with realistic furniture and decor — **your walls, floors, windows and light stay exactly as photographed**, only freestanding furniture, rugs, lamps, plants and art are added.
>
> **What you get for every photo**
> • 2 staged versions of your exact photo — pick the one that sells
> • 6 styles: Modern, Scandinavian, Farmhouse, Mid-century, Luxury, Coastal
> • High-resolution JPG, ready for the MLS and listing sites
> • Copies labeled "Virtually staged" for MLS/California AB 723 disclosure
> • 1 free revision if anything structural looks changed
>
> **How it works**
> 1. Send your photos (straight-on, well lit, empty or nearly empty rooms work best)
> 2. Tell me the room type of each photo and one style
> 3. Receive the staged photos — usually well before the deadline
>
> AI-assisted staging, checked by a person before delivery. Please disclose virtual staging in your listing as your MLS requires.

## FAQ

- **Will you change walls, floors or windows?** No. Only freestanding furniture and decor are added. If anything structural changed, the revision is free.
- **Which photos work best?** Straight-on or a slight angle, daylight, the whole room in frame, nothing blocking the floor.
- **Can you remove existing furniture first?** Ask before ordering. Light decluttering is possible case by case.
- **Do I need to disclose virtual staging?** Most MLSs and California's AB 723 require a disclosure. You get labeled copies for that.

## Buyer requirements (asked at order time)

1. Upload your room photos (JPG/PNG, one per room).
2. The room type of each photo (living room, bedroom, dining room, home office, kitchen, patio).
3. One style for all photos (Modern, Scandinavian, Farmhouse, Mid-century, Luxury, Coastal).
4. Anything to keep or avoid (optional).

## Fulfilment through ORVIONIS (≈ 2 minutes per order)

1. Download the buyer's photos from the Fiverr order.
2. `/admin/orders` → **+ External order** → Virtual Staging.
3. Upload the photos, pick each room type and the style, then fill in:
   - channel: Fiverr;
   - buyer paid: the package price;
   - fee: pre-filled at 20 %;
   - the Fiverr order number.
4. Press **Create order and run it**. The staged photos arrive by email in about 2 minutes per photo, and they stay on the admin order page.
5. On the admin order page, click **Download delivered files (ZIP)** and **look at every image** (the gig promises a human check: walls, windows, floors and fixtures must be unchanged; press **Free redo** for any that aren't). Then upload the ZIP to Fiverr and deliver with a short thank-you.
6. If the buyer asks for a revision, press **Free redo** on the admin order page and deliver the new files the same way.

The revenue shows up in `/admin/analytics` under channel **fiverr**, after the 20 % fee.
