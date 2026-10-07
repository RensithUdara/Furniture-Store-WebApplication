import "server-only";
import { isConfigured } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { supabase } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";
import { getRatings } from "@/services/shopping";

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
  const [{ data, error }, ratings] = await Promise.all([q, getRatings()]);
  if (error) throw error;
  return (data as Product[]).map((p) => {
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
}
export async function getProduct(key: string, admin = false) {
  const products = await getProducts(admin);
  return products.find((p) => p.slug === key || p.id === key);
}
