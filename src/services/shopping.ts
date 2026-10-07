import "server-only";
import { isConfigured, serviceKey } from "@/lib/config";
import { serviceClient, supabase } from "@/lib/supabase/server";
import type {
  Address,
  DeliveryZone,
  Order,
  ReturnRequest,
  Review,
  StockAlert,
} from "@/types";

// Readers for the features added by migration 011. Until it has been run the tables and
// functions do not exist; each reader then returns an empty result (or null where the caller
// needs to tell "not available" apart from "none yet"), and the matching UI stays hidden.
const missing = (error: { code?: string } | null) =>
  Boolean(error && ["PGRST205", "PGRST202", "PGRST200", "42P01", "42703", "42883"].includes(error.code || ""));

// Average rating and review count per product id.
export async function getRatings(): Promise<Record<string, { avg: number; count: number }>> {
  if (!isConfigured()) return {};
  const db = await supabase();
  const { data, error } = await db.from("product_reviews").select("product_id,rating");
  if (error) {
    if (missing(error)) return {};
    throw error;
  }
  const sums: Record<string, { total: number; count: number }> = {};
  for (const r of data) {
    const s = (sums[r.product_id] ||= { total: 0, count: 0 });
    s.total += r.rating;
    s.count++;
  }
  return Object.fromEntries(
    Object.entries(sums).map(([id, s]) => [id, { avg: s.total / s.count, count: s.count }]),
  );
}
export async function getReviews(productId: string): Promise<Review[] | null> {
  const db = await supabase();
  const { data, error } = await db
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as Review[];
}
// True when the signed-in customer has had this product delivered. The database decides.
export async function canReview(productId: string) {
  const db = await supabase();
  const { data, error } = await db.rpc("can_review", { p_product: productId });
  return !error && data === true;
}
export async function getAlsoBoughtIds(productId: string): Promise<string[]> {
  const db = await supabase();
  const { data, error } = await db.rpc("also_bought", { p_product: productId });
  return error || !Array.isArray(data) ? [] : (data as string[]);
}
export async function getAddresses(): Promise<Address[] | null> {
  const db = await supabase();
  const { data, error } = await db
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) {
    if (missing(error)) return null;
    // Signed-out visitors have no address book.
    if (error.code === "42501") return [];
    throw error;
  }
  return data as Address[];
}
export async function getZones(includeInactive = false): Promise<DeliveryZone[]> {
  if (!isConfigured()) return [];
  const db = await supabase();
  let q = db.from("delivery_zones").select("*").order("district");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return data as DeliveryZone[];
}
// Back-in-stock requests. Row-level security returns a customer's own, or all of them to staff
// with the inventory permission.
export async function getStockAlerts(): Promise<StockAlert[]> {
  const db = await supabase();
  const { data, error } = await db
    .from("stock_alerts")
    .select("*,product_variants(color,material,sku,stock_quantity,products(name,slug))")
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error) || error.code === "42501") return [];
    throw error;
  }
  return data as unknown as StockAlert[];
}
export async function getReturn(orderId: string): Promise<ReturnRequest | null> {
  const db = await supabase();
  const { data, error } = await db
    .from("return_requests")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    if (missing(error) || error.code === "42501") return null;
    throw error;
  }
  return data as ReturnRequest | null;
}
// Open return requests for the admin orders list.
export async function getReturns(): Promise<ReturnRequest[]> {
  const db = await supabase();
  const { data, error } = await db
    .from("return_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error) || error.code === "42501") return [];
    throw error;
  }
  return data as ReturnRequest[];
}
// A guest order is reached with its own unguessable token instead of a sign-in. No session
// identifies the visitor, so the server key is used, and only for a row whose token matches
// and which belongs to no account.
export async function getGuestOrder(token: string): Promise<Order | null> {
  if (!serviceKey() || !/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data, error } = await serviceClient()
    .from("orders")
    .select("*,order_items(*)")
    .eq("guest_token", token)
    .is("user_id", null)
    .maybeSingle();
  if (error) return null;
  return data as Order | null;
}
