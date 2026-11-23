import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Page titles and descriptions are always sent in the <head>, for every visitor. By default
  // Next.js streams them in later for ordinary browsers, which some crawlers and audit tools
  // (and link-preview fetchers not on its built-in list) do not wait for.
  htmlLimitedBots: /.*/,
  images: {
    // Smaller modern formats, served at the size each screen needs.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Only the store's own images are resized: the bundled ones, and uploads in Supabase
    // Storage. Anything else is shown as it is (see components/photo.tsx).
    localPatterns: [{ pathname: "/images/**", search: "" }],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // The bundled images rarely change: let browsers keep them for a day, and reuse a
        // stale copy for a week while a fresh one is fetched.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};
export default config;
