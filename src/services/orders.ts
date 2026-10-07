import "server-only";
import { supabase } from "@/lib/supabase/server";
import { requirePermission, requireUser } from "@/lib/auth";
import type { Order, PaymentEvent } from "@/types";
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
