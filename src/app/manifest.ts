import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
// Lets phones add the store to the home screen with its own name, icon and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Furniture`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#16213e",
    theme_color: "#16213e",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
