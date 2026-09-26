import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
