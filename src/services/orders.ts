import "server-only";
import { supabase } from "@/lib/supabase/server";
import { requirePermission, requireUser } from "@/lib/auth";
import type { Order, OrderEvent, PaymentEvent } from "@/types";
export async function getOrders(admin = false): Promise<Order[]> {
  // The dashboard summarises orders, so it may read them too.
  const user = admin ? await requirePermission("orders", "dashboard") : await requireUser();
  const db = await supabase();
  let q = db.from("orders").select("*,order_items(*)").order("created_at", { ascending: false });
  if (!admin) q = q.eq("user_id", user.id);
  const { data, error } = await q;
  if (error) throw error;
  return data as Order[];
}
export async function getOrder(id: string): Promise<Order | null> {
  await requireUser();
  const db = await supabase();
  const { data, error } = await db
    .from("orders")
    .select("*,order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}
// RLS only returns payment events to admins.
export async function getPaymentEvents(orderId: string): Promise<PaymentEvent[]> {
  await requirePermission("orders");
  const db = await supabase();
  const { data, error } = await db
    .from("payment_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PaymentEvent[];
}
// The order's tracking history. Row-level security returns it only to the customer who placed
// the order or to staff who may see orders. Empty until migration 009 has been run.
export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  await requireUser();
  const db = await supabase();
  const { data, error } = await db
    .from("order_events")
    .select("id,event,detail,created_at")
    .eq("order_id", orderId)
    .order("id");
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw error;
  }
  return data as OrderEvent[];
}
// Whether the tracking-history table exists yet, for the admin's "database update needed" notice.
export async function orderEventsReady() {
  const db = await supabase();
  const { error } = await db.from("order_events").select("id").limit(1);
  return !(error && (error.code === "PGRST205" || error.code === "42P01"));
}
