import "server-only";
import { serviceClient } from "@/lib/supabase/server";

const digits = (value: string) => value.replace(/\D/g, "").slice(-9);

// Looks an order up for someone who is not signed in. The caller must know the order number
// AND the phone number or email used on that order. Because no session identifies them, the
// lookup uses the server-only key, so it returns only what tracking needs: no street address,
// phone, email, or payment identifiers. Returns null both for "no such order" and for "wrong
// contact", so order numbers cannot be probed. Callers rate-limit before calling.
export async function lookupOrder(orderNumber: string, contact: string) {
  const db = serviceClient();
  const { data: order } = await db
    .from("orders")
    .select("*,order_items(product_name,variant_details,quantity)")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();
  const given = contact.trim().toLowerCase();
  const matches =
    order &&
    (given.includes("@")
      ? given === String(order.customer_email).toLowerCase()
      : digits(given).length === 9 && digits(given) === digits(String(order.customer_phone)));
  if (!matches) return null;
  // Empty until migration 009 has been run; tracking then shows the current status only.
  const { data: events } = await db
    .from("order_events")
    .select("id,event,detail,created_at")
    .eq("order_id", order.id)
    .order("id");
  return {
    order_number: order.order_number as string,
    created_at: order.created_at as string,
    order_status: order.order_status as string,
    payment_status: order.payment_status as string,
    payment_method: order.payment_method as string,
    fulfillment_method: (order.fulfillment_method || "DELIVERY") as string,
    pickup_at: (order.pickup_at || null) as string | null,
    tracking_number: (order.tracking_number || "") as string,
    courier: (order.courier || "") as string,
    city: order.city as string,
    estimated_from: (order.estimated_from || null) as string | null,
    estimated_to: (order.estimated_to || null) as string | null,
    total_amount: Number(order.total_amount),
    items: order.order_items as {
      product_name: string;
      variant_details: string;
      quantity: number;
    }[],
    events: (events || []) as { id: number; event: string; detail: string; created_at: string }[],
  };
}
