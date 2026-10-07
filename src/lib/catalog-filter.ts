import type { Product } from "@/types";

export type CatalogFilter = {
  q?: string;
  category?: string;
  // Slugs of the selected category's sub-categories, so a parent also lists their products.
  children?: string[];
  min?: number;
  max?: number;
  inStock?: boolean;
  sort?: string;
};
export const sortOptions = [
  ["newest", "Newest arrivals"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
  ["name", "Name: A to Z"],
] as const;
export const totalStock = (p: Product) =>
  p.product_variants.filter((v) => v.is_active).reduce((a, v) => a + v.stock_quantity, 0);

// One implementation for the storefront browser and GET /api/products, so both always agree.
export function filterProducts(products: Product[], f: CatalogFilter) {
  const words = (f.q || "").toLowerCase().split(/\s+/).filter(Boolean);
  return products
    .filter((p) => {
      const haystack =
        `${p.name} ${p.material} ${p.description} ${p.categories?.name} ${p.product_variants.map((v) => v.color).join(" ")}`.toLowerCase();
      return (
        (!f.category ||
          p.categories?.slug === f.category ||
          Boolean(f.children?.includes(p.categories?.slug))) &&
        words.every((w) => haystack.includes(w)) &&
        (f.min === undefined || p.price >= f.min) &&
        (f.max === undefined || p.price <= f.max) &&
        (!f.inStock || totalStock(p) > 0)
      );
    })
    .sort((a, b) =>
      f.sort === "price-low"
        ? a.price - b.price
        : f.sort === "price-high"
          ? b.price - a.price
          : f.sort === "name"
            ? a.name.localeCompare(b.name)
            : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
}
export const childSlugs = (
  categories: { id: string; slug: string; parent_id?: string | null }[],
  slug: string,
) => {
  const parent = categories.find((c) => c.slug === slug);
  return parent ? categories.filter((c) => c.parent_id === parent.id).map((c) => c.slug) : [];
};
