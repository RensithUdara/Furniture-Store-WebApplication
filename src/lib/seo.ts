import type { Metadata } from "next";
import { appUrl } from "@/lib/config";
// The public address of the store, used for links that leave the site: the sitemap, share
// previews and structured data. Taken from APP_URL; local development falls back to localhost.
export const siteUrl = () => appUrl() || "http://localhost:3000";
export const absolute = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
// JSON for a <script type="application/ld+json"> tag. "<" is escaped so that text from the
// database (a product name, a review) can never close the script tag.
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
export const SITE_NAME = "Forma & Co.";
export const SITE_TAGLINE = "Furniture for a life well lived";
export const SITE_DESCRIPTION =
  "Shop modern furniture online in Sri Lanka: sofas, beds, dining tables, chairs, desks and storage. Islandwide delivery, secure PayHere checkout, cash on delivery and store pickup in Hikkaduwa.";
export const SHARE_IMAGE = {
  url: "/images/og-image.jpg",
  width: 1200,
  height: 675,
  alt: "Forma & Co. — modern furniture for every space",
};
// The title, description, canonical address and share preview for one page.
// `path` is the page's own address; search engines are told that is the one to index, so the
// same page reached with tracking or filter parameters is not counted as a separate page.
export function pageMeta({
  title,
  description,
  path,
  index = true,
}: {
  title?: string;
  description: string;
  path: string;
  // False for pages that should stay out of search results.
  index?: boolean;
}): Metadata {
  const full = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_LK",
      title: full,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [SHARE_IMAGE.url] },
  };
}
// For private and personal pages: kept out of search results.
export const PRIVATE: Metadata["robots"] = { index: false, follow: false };
