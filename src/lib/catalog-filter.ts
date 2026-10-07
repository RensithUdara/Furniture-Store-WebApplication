import type { Product } from "@/types";

export type CatalogFilter = {
  q?: string;
  category?: string;
  // Slugs of the selected category's sub-categories, so a parent also lists their products.
  children?: string[];
  min?: number;
  max?: number;
  inStock?: boolean;
  // Only products with a reduced price: a flash sale or a "was" price.
  sale?: boolean;
  materials?: string[];
  colours?: string[];
  sizes?: string[];
  rooms?: string[];
  sort?: string;
};
export const sortOptions = [
  ["newest", "Newest arrivals"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
  ["name", "Name: A to Z"],
] as const;
// How many products the storefront asks for at a time.
export const PAGE_SIZE = 24;
// The fixed choices for a product's size and rooms (migration 012).
export const SIZES = ["Small", "Medium", "Large", "Extra large"] as const;
export const ROOMS = [
  "Living room",
  "Bedroom",
  "Dining room",
  "Home office",
  "Kitchen",
  "Kids room",
  "Hallway",
  "Outdoor",
] as const;
// Finishes are free text ("Smoked oak"), so the colour filter groups them by their swatch.
export const COLOURS = [
  { name: "White", hex: "#ffffff" },
  { name: "Beige", hex: "#d9c7a8" },
  { name: "Brown", hex: "#7a5236" },
  { name: "Grey", hex: "#9a9a9a" },
  { name: "Black", hex: "#1c1c1c" },
  { name: "Red", hex: "#c93a3a" },
  { name: "Orange", hex: "#e2832b" },
  { name: "Yellow", hex: "#e6c229" },
  { name: "Green", hex: "#4f8a5b" },
  { name: "Blue", hex: "#3d6fb4" },
  { name: "Purple", hex: "#7d5ba6" },
  { name: "Pink", hex: "#d98aa6" },
] as const;
export function colourFamily(hex: string) {
  const n = /^#[0-9a-f]{6}$/i.test(hex) ? parseInt(hex.slice(1), 16) : 0x999999;
  const r = (n >> 16) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2,
    d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  if (l >= 0.92 && s < 0.5) return "White";
  if (l <= 0.13) return "Black";
  if (s < 0.1) return "Grey";
  // Woods and natural fabrics: warm hues that are dark (brown) or pale and soft (beige).
  if (h >= 10 && h < 55) {
    if (l < 0.42) return "Brown";
    if (s < 0.5) return l < 0.55 ? "Brown" : "Beige";
  }
  if (h < 15 || h >= 345) return "Red";
  if (h < 40) return "Orange";
  if (h < 70) return "Yellow";
  if (h < 165) return "Green";
  if (h < 260) return "Blue";
  if (h < 300) return "Purple";
  return "Pink";
}
export const totalStock = (p: Product) =>
  p.product_variants.filter((v) => v.is_active).reduce((a, v) => a + v.stock_quantity, 0);
export const onSale = (p: Product) =>
  Boolean(p.flash) ||
  p.product_variants.some((v) => v.is_active && Number(v.compare_at_price || 0) > Number(v.price));
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const colours = (p: Product) =>
  p.product_variants.filter((v) => v.is_active).map((v) => colourFamily(v.color_hex));

// One implementation for the storefront and GET /api/products, so both always agree.
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
        (!f.inStock || totalStock(p) > 0) &&
        (!f.sale || onSale(p)) &&
        (!f.materials?.length || f.materials.some((m) => same(m, p.material))) &&
        (!f.colours?.length || colours(p).some((c) => f.colours!.includes(c))) &&
        (!f.sizes?.length || f.sizes.includes(p.size || "")) &&
        (!f.rooms?.length || f.rooms.some((r) => p.rooms?.includes(r)))
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

// The choices the filter panel offers: only values that at least one product actually has.
export type Facets = {
  // Product count per category slug (a parent includes its sub-categories); "" is everything.
  categories: Record<string, number>;
  materials: string[];
  colours: string[];
  sizes: string[];
  rooms: string[];
};
export function facets(
  products: Product[],
  categories: { id: string; slug: string; parent_id?: string | null }[],
): Facets {
  const materials = new Map<string, string>();
  for (const p of products)
    if (p.material?.trim() && !materials.has(p.material.trim().toLowerCase()))
      materials.set(p.material.trim().toLowerCase(), p.material.trim());
  const present = new Set(products.flatMap(colours));
  return {
    categories: Object.fromEntries(
      [{ slug: "" }, ...categories].map((c) => [
        c.slug,
        filterProducts(products, { category: c.slug, children: childSlugs(categories, c.slug) })
          .length,
      ]),
    ),
    materials: [...materials.values()].sort((a, b) => a.localeCompare(b)),
    colours: COLOURS.map((c) => c.name).filter((c) => present.has(c)),
    sizes: SIZES.filter((s) => products.some((p) => p.size === s)),
    rooms: ROOMS.filter((r) => products.some((p) => p.rooms?.includes(r))),
  };
}

// Filters travel in the address bar and to the API in the same form. Lists are joined with
// "|" because a material name may contain a comma.
const LISTS = [
  ["material", "materials"],
  ["colour", "colours"],
  ["size", "sizes"],
  ["room", "rooms"],
] as const;
export function parseFilter(get: (key: string) => string | null | undefined): CatalogFilter {
  const amount = (key: string) => {
    const raw = get(key),
      n = Number(raw);
    return raw && Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const f: CatalogFilter = {
    q: get("q")?.slice(0, 100) || undefined,
    category: get("category")?.slice(0, 100) || undefined,
    min: amount("min"),
    max: amount("max"),
    inStock: get("in_stock") === "1",
    sale: get("sale") === "1",
    sort: get("sort") || undefined,
  };
  for (const [param, key] of LISTS) {
    const values = (get(param) || "")
      .split("|")
      .map((v) => v.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 20);
    if (values.length) f[key] = values;
  }
  return f;
}
export function filterParams(f: CatalogFilter) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.category) params.set("category", f.category);
  if (f.min !== undefined) params.set("min", String(f.min));
  if (f.max !== undefined) params.set("max", String(f.max));
  if (f.inStock) params.set("in_stock", "1");
  if (f.sale) params.set("sale", "1");
  for (const [param, key] of LISTS) if (f[key]?.length) params.set(param, f[key]!.join("|"));
  if (f.sort && f.sort !== "newest") params.set("sort", f.sort);
  return params;
}
