import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { brand } from "@/config/brand";

/** Web app manifest: name, colours and the official ORVIONIS mark for home screens and browser UIs. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: brand.colors.background,
    theme_color: brand.colors.background,
    icons: [
      { src: brand.appIcon[192], sizes: "192x192", type: "image/png", purpose: "any" },
      { src: brand.appIcon[512], sizes: "512x512", type: "image/png", purpose: "any" },
      { src: brand.appIcon.maskable512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
