import "server-only";
import { isConfigured } from "@/lib/config";
import { supabase } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import type { Coupon, LedgerEntry } from "@/types";

// These tables arrive with migration 006. Each reader returns null until then, and the
// matching part of the interface stays hidden instead of failing.
const missing = (error: { code?: string }) => error.code === "PGRST205" || error.code === "42P01";

// Product ids the signed-in customer has saved. RLS limits the rows to their own.
export async function getWishlistIds(): Promise<string[] | null> {
  if (!isConfigured()) return null;
  const db = await supabase();
  const { data, error } = await db
    .from("wishlist_items")
    .select("product_id")
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return null;
    // Anonymous visitors have no access to the table at all; treat that as an empty list.
    if (error.code === "42501") return [];
    throw error;
  }
  return data.map((row) => row.product_id as string);
}
export async function getLedger(): Promise<LedgerEntry[] | null> {
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return [];
  const { data, error } = await db
    .from("loyalty_ledger")
    .select("id,order_id,points,reason,created_at,orders(order_number)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as unknown as LedgerEntry[];
}
export async function getCoupons(): Promise<Coupon[] | null> {
  await requirePermission("coupons");
  const db = await supabase();
  const { data, error } = await db
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as Coupon[];
}
