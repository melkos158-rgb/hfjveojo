/**
 * Category artwork (files in /public/img). WebP for pages, JPEG twins for the Open Graph renderer,
 * which does not decode WebP. Add a pair per category; tools without a category image fall back to none.
 */
export const CATEGORY_VISUALS: Record<string, { webp: string; jpg: string; alt: string }> = {
  "real-estate": {
    webp: "/img/hero-real-estate.webp",
    jpg: "img/hero-real-estate.jpg",
    alt: "A phone on a tripod filming a bright, staged living room for a listing walkthrough",
  },
  photography: {
    webp: "/img/hero-photographers.webp",
    jpg: "img/hero-photographers.jpg",
    alt: "A printed photography pricing guide open on a desk next to a camera",
  },
};

export function categoryVisual(category: string) {
  return CATEGORY_VISUALS[category];
}
