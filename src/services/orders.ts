import "server-only";
import { serviceClient, supabase } from "@/lib/supabase/server";
import { requirePermission, requireUser } from "@/lib/auth";
import type { Order, OrderEvent, PaymentEvent } from "@/types";
// Cancels PayHere orders left unpaid past the allowed time (migration 010). The database also
// does this on a schedule where it can; calling it here guarantees it has happened at the moments
// that matter: before an order is created, paid, opened or listed. At most once a minute per
// server, and never allowed to break the request it rides on.
let lastSweep = 0;
export async function expireUnpaidOrders() {
  if (Date.now() - lastSweep < 60_000) return;
  lastSweep = Date.now();
  try {
    await serviceClient().rpc("expire_unpaid_orders");
  } catch {
    /* No server key or migration 010 not run yet: nothing to expire. */
  }
}
export async function getOrders(admin = false): Promise<Order[]> {
  // The dashboard summarises orders, so it may read them too.
  const user = admin ? await requirePermission("orders", "dashboard") : await requireUser();
  await expireUnpaidOrders();
  const db = await supabase();
  let q = db.from("orders").select("*,order_items(*)").order("created_at", { ascending: false });
  if (!admin) q = q.eq("user_id", user.id);
  const { data, error } = await q;
  if (error) throw error;
  return data as Order[];
}
export async function getOrder(id: string): Promise<Order | null> {
  await requireUser();
  await expireUnpaidOrders();
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
// An order for the caller: their own (or any, for staff) when signed in, or a guest order when
// the matching token is supplied. Returns null when neither applies.
export async function getOrderByAccess(id: string, token?: string | null): Promise<Order | null> {
  if (token) {
    const { getGuestOrder } = await import("@/services/shopping");
    const order = await getGuestOrder(token);
    return order && order.id === id ? order : null;
  }
  return getOrder(id);
}
