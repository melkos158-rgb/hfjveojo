import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * Short links for places where a link can't be clicked or a long one looks wrong: the TikTok bio (no clickable link
 * below 1,000 followers), video end cards, and personal DMs (a URL full of tracking tags reads as spam in a one-to-one
 * message). A visit through one arrives with campaign tags, so `/admin/analytics` shows its channel instead of
 * `direct`. Temporary (307) redirects, so a target can change later without browsers caching the old one.
 * `/try` is only for the personal Instagram DMs to agents (E19); use another short link for any other channel.
 */
export const SHORT_LINKS: { source: string; destination: string }[] = [
  { source: "/tt", destination: "/tools/virtual-staging?utm_source=tiktok&utm_medium=social&utm_campaign=video-test" },
  { source: "/try", destination: "/tools/virtual-staging?exp=e4-virtual-staging&utm_source=instagram_dm&utm_campaign=realtor-dm" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Typed by hand, so accept the upper-case spelling too.
    return SHORT_LINKS.flatMap(({ source, destination }) => [
      { source, destination, permanent: false },
      { source: source.toUpperCase(), destination, permanent: false },
    ]);
  },
  // Metadata (title, description, canonical, OG) always rendered in <head>, for every user agent. Next 15.2+ otherwise
  // streams it into <body> for Googlebot and for crawlers missing from its "HTML-limited bots" list (GPTBot, ClaudeBot,
  // PerplexityBot…), and a canonical outside <head> is ignored. Our metadata is static, so blocking costs nothing.
  htmlLimitedBots: /.*/,
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
