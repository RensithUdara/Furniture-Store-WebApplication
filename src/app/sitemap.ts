import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/services/catalog";
import { isConfigured } from "@/lib/config";
import { absolute } from "@/lib/seo";
// Built from the database on each request, so a new product is listed straight away.
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: absolute("/"), changeFrequency: "daily", priority: 1, lastModified: new Date() },
    { url: absolute("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/bundles"), changeFrequency: "weekly", priority: 0.6 },
    ...["/faq", "/help", "/warranty", "/refund-policy", "/terms", "/track"].map((path) => ({
      url: absolute(path),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
  if (!isConfigured()) return pages;
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return [
      ...pages,
      ...categories.map((c) => ({
        url: absolute(`/products?category=${c.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((p) => ({
        url: absolute(`/products/${p.slug}`),
        lastModified: new Date(p.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: p.product_images.slice(0, 5).map((i) => absolute(i.image_url)),
      })),
    ];
  } catch {
    // The database is unreachable: still answer with the fixed pages.
    return pages;
  }
}
