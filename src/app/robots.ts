import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
// Search engines may read the shop. Private and personal pages are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/account",
        "/checkout",
        "/cart",
        "/orders",
        "/login",
        "/register",
        "/forgot-password",
        "/auth/",
        "/compare",
        "/unsubscribe",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
