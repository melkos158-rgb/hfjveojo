import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * Short links for places where a link can't be clicked: the TikTok bio (no clickable link below 1,000 followers) and
 * video end cards. A visit through one arrives with campaign tags, so `/admin/analytics` shows its channel instead of
 * `direct`. Temporary (307) redirects, so a target can change later without browsers caching the old one.
 */
export const SHORT_LINKS: { source: string; destination: string }[] = [
  { source: "/tt", destination: "/tools/virtual-staging?utm_source=tiktok&utm_medium=social&utm_campaign=video-test" },
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
