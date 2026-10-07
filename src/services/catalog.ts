import "server-only";
import { isConfigured } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { supabase } from "@/lib/supabase/server";
import type { Bundle, Category, Product } from "@/types";
import { childSlugs, filterProducts, PAGE_SIZE, type CatalogFilter } from "@/lib/catalog-filter";
import { getRatings } from "@/services/shopping";
import { getFlashSales } from "@/services/marketing";
import { withFlash } from "@/lib/flash";

// Every catalog read comes from PostgreSQL; there is no in-code sample data.
async function database() {
  if (!isConfigured()) throw new HttpError(503, "The store database is not connected.");
  return supabase();
}
export async function getCategories(admin = false): Promise<Category[]> {
  const db = await database();
  let q = db.from("categories").select("*").order("name");
  if (!admin) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
export async function getProducts(admin = false): Promise<Product[]> {
  const db = await database();
  let q = db
    .from("products")
    .select("*,categories!inner(*),product_images(*),product_variants(*)")
    .order("created_at", { ascending: false });
  if (!admin) q = q.eq("is_active", true).eq("categories.is_active", true);
  // The storefront shows running flash-sale prices; the admin always sees the usual prices.
  const [{ data, error }, ratings, sales] = await Promise.all([
    q,
    getRatings(),
    admin ? null : getFlashSales(),
  ]);
  if (error) throw error;
  const list = (data as Product[]).map((p) => {
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
  return sales?.length ? list.map((p) => withFlash(p, sales)) : list;
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
