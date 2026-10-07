import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { trackSchema } from "@/lib/validation";
import { apiError, checkOrigin, HttpError, readJson } from "@/lib/http";
import { serviceKey } from "@/lib/config";
export const runtime = "nodejs";

const digits = (value: string) => value.replace(/\D/g, "").slice(-9);

// Order tracking without signing in. The caller must know the order number AND the phone
// number or email used on that order. Because no session identifies them, the lookup uses the
// server-only key, so this handler is careful to return only what a tracking page needs:
// no street address, phone, email, or payment identifiers.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!serviceKey()) throw new HttpError(503, "Order tracking is not available right now.");
    const { order_number, contact } = trackSchema.parse(await readJson(request));
    const db = serviceClient();
    const { data: order } = await db
      .from("orders")
      .select("*,order_items(product_name,variant_details,quantity)")
      .eq("order_number", order_number.toUpperCase())
      .maybeSingle();
    const given = contact.trim().toLowerCase();
    const matches =
      order &&
      (given.includes("@")
        ? given === String(order.customer_email).toLowerCase()
        : digits(given).length === 9 && digits(given) === digits(String(order.customer_phone)));
    // One answer for "no such order" and "wrong contact", so order numbers cannot be probed.
    if (!matches)
      throw new HttpError(
        404,
        "We could not find an order with that number and contact detail. Check both and try again.",
      );
    // Empty until migration 009 has been run; the page then shows the current status only.
    const { data: events } = await db
      .from("order_events")
      .select("id,event,detail,created_at")
      .eq("order_id", order.id)
      .order("id");
    return NextResponse.json({
      order_number: order.order_number,
      created_at: order.created_at,
      order_status: order.order_status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      fulfillment_method: order.fulfillment_method || "DELIVERY",
      pickup_at: order.pickup_at || null,
      tracking_number: order.tracking_number || "",
      courier: order.courier || "",
      city: order.city,
      total_amount: Number(order.total_amount),
      items: order.order_items,
      events: events || [],
    });
  } catch (e) {
    return apiError(e);
  }
}
