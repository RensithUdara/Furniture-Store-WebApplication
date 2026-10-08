import "server-only";
import { isConfigured } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { publicClient, supabase } from "@/lib/supabase/server";
import { catalogVersion } from "@/lib/catalog-cache";
import type { Bundle, Category, FlashSale, Product } from "@/types";
import { childSlugs, filterProducts, PAGE_SIZE, type CatalogFilter } from "@/lib/catalog-filter";
import { getRatings } from "@/services/shopping";
import { withFlash } from "@/lib/flash";

// Every catalog read comes from PostgreSQL; there is no in-code sample data.
async function database() {
  if (!isConfigured()) throw new HttpError(503, "The store database is not connected.");
  return supabase();
}
const shape = (list: Product[], ratings: Awaited<ReturnType<typeof getRatings>>, admin: boolean) =>
  list.map((p) => {
    const active = p.product_variants.filter((v) => v.is_active);
    return {
      ...p,
      rating: ratings[p.id],
      price: active.length ? Math.min(...active.map((v) => Number(v.price))) : Number(p.price),
      product_images: p.product_images.sort((a, b) => a.sort_order - b.sort_order),
      product_variants: p.product_variants
        .filter((v) => admin || v.is_active)
        .sort((a, b) => a.sku.localeCompare(b.sku)),
    };
  });

// The public catalogue is the same for every visitor, so one copy is shared between requests
// instead of asking the database for it on every page. It is read with no session (exactly
// what a signed-out visitor may see), kept for at most 30 seconds, and thrown away at once
// when anything is changed through the app. Stock is still checked by the database when an
// order is saved, so a copy that is a few seconds old can never oversell.
type Shared = { products: Product[]; categories: Category[]; sales: FlashSale[] };
const cache = globalThis as unknown as {
  __formaCatalog?: { version: number; at: number; data: Promise<Shared> };
};
const TTL = 30_000;
async function loadShared(): Promise<Shared> {
  if (!isConfigured()) throw new HttpError(503, "The store database is not connected.");
  const db = publicClient();
  const [products, categories, reviews, sales] = await Promise.all([
    db
      .from("products")
      .select("*,categories!inner(*),product_images(*),product_variants(*)")
      .eq("is_active", true)
      .eq("categories.is_active", true)
      .order("created_at", { ascending: false }),
    db.from("categories").select("*").eq("is_active", true).order("name"),
    // Reviews (migration 011) and flash sales (014) may not exist yet; then there are none.
    db.from("product_reviews").select("product_id,rating"),
    db.from("flash_sales").select("*,flash_sale_items(product_id)"),
  ]);
  if (products.error) throw products.error;
  if (categories.error) throw categories.error;
  const sums: Record<string, { total: number; count: number }> = {};
  for (const r of reviews.data || []) {
    const s = (sums[r.product_id] ||= { total: 0, count: 0 });
    s.total += r.rating;
    s.count++;
  }
  const ratings = Object.fromEntries(
    Object.entries(sums).map(([id, s]) => [id, { avg: s.total / s.count, count: s.count }]),
  );
  return {
    products: shape(products.data as Product[], ratings, false),
    categories: categories.data as Category[],
    sales: (sales.data || []).map(({ flash_sale_items, ...f }) => ({
      ...f,
      discount_percent: Number(f.discount_percent),
      product_ids: (flash_sale_items as { product_id: string }[]).map((i) => i.product_id),
    })) as FlashSale[],
  };
}
function shared() {
  const hit = cache.__formaCatalog;
  if (hit && hit.version === catalogVersion() && Date.now() - hit.at < TTL) return hit.data;
  const entry = { version: catalogVersion(), at: Date.now(), data: loadShared() };
  cache.__formaCatalog = entry;
  // A failed load is not kept: the next request tries again.
  entry.data.catch(() => {
    if (cache.__formaCatalog === entry) cache.__formaCatalog = undefined;
  });
  return entry.data;
}

export async function getCategories(admin = false): Promise<Category[]> {
  if (!admin) return (await shared()).categories;
  const db = await database();
  const { data, error } = await db.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}
export async function getProducts(admin = false): Promise<Product[]> {
  if (!admin) {
    // Flash-sale prices are applied on each read, so a sale starts and ends on time.
    const { products, sales } = await shared();
    return sales.length ? products.map((p) => withFlash(p, sales)) : products;
  }
  // The admin always reads the live rows, hidden ones included, at their usual prices.
  const db = await database();
  const [{ data, error }, ratings] = await Promise.all([
    db
      .from("products")
      .select("*,categories!inner(*),product_images(*),product_variants(*)")
      .order("created_at", { ascending: false }),
    getRatings(),
  ]);
  if (error) throw error;
  return shape(data as Product[], ratings, true);
}
export async function getProduct(key: string, admin = false) {
  const products = await getProducts(admin);
  return products.find((p) => p.slug === key || p.id === key);
}
// One page of the storefront catalogue. Filtering happens here, on the server, so the browser
// only ever receives the products it is about to show.
export async function browse(filter: CatalogFilter, page = 1, limit = PAGE_SIZE) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const matches = filterProducts(products, {
    ...filter,
    children: filter.category ? childSlugs(categories, filter.category) : undefined,
  });
  return {
    items: matches.slice((page - 1) * limit, page * limit),
    total: matches.length,
    page,
    products,
    categories,
  };
}
// Room sets. Null means the tables are not there yet (migration 012 has not been run).
export async function getBundles(admin = false): Promise<Bundle[] | null> {
  if (!isConfigured()) return null;
  const db = await supabase();
  let q = db.from("bundles").select("*,bundle_items(product_id,sort_order)").order("created_at");
  if (!admin) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    if (["PGRST205", "PGRST200", "42P01"].includes(error.code || "")) return null;
    throw error;
  }
  return data.map(({ bundle_items, ...b }) => ({
    ...b,
    discount_percent: Number(b.discount_percent),
    product_ids: (bundle_items as { product_id: string; sort_order: number }[])
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((i) => i.product_id),
  })) as Bundle[];
}
// Sets a shopper can actually complete: every product in them is on sale in the store.
export async function getShopBundles(products: Product[]) {
  const ids = new Set(products.map((p) => p.id));
  return ((await getBundles()) || []).filter(
    (b) => b.product_ids.length >= 2 && b.product_ids.every((id) => ids.has(id)),
  );
}
