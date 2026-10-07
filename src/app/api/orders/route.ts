import { NextResponse, after } from "next/server";
import { currentUser } from "@/lib/auth";
import { serviceKey } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { serviceClient, supabase } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { expireUnpaidOrders, getOrders } from "@/services/orders";
import { notifyLowStock } from "@/services/admin";
import { payhere, whatsappNumber } from "@/lib/config";
export async function GET() {
  try {
    return NextResponse.json(await getOrders());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    // Signed-in customers order under their account; anyone else checks out as a guest.
    const user = await currentUser();
    const { items, payment_method, idempotency_key, ...customer } = checkoutSchema.parse(
      await readJson(request),
    );
    if (payment_method === "PAYHERE" && !payhere().ready)
      throw new HttpError(503, "Online payment is not yet available. Please choose WhatsApp.");
    if (payment_method === "WHATSAPP" && !/^[1-9]\d{7,14}$/.test(whatsappNumber()))
      throw new HttpError(503, "WhatsApp ordering is not yet configured.");
    // Free any stock still held by abandoned online orders before reserving for this one.
    await expireUnpaidOrders();
    if (!user) {
      // No session to tie the order to, so the server key creates it, after rate limiting.
      // The response carries the order's private token, which is how a guest returns to it.
      if (!serviceKey()) throw new HttpError(401, "Please sign in to continue.");
      await rateLimit("guest-order-ip", clientIp(request), 8, 3600);
      await rateLimit("guest-order-email", customer.customer_email.toLowerCase(), 5, 3600);
      const { data: guest, error: guestError } = await serviceClient().rpc("create_guest_order", {
        p_customer: customer,
        p_items: items,
        p_method: payment_method,
        p_key: idempotency_key,
      });
      // PGRST202: guest checkout arrives with migration 011.
      if (guestError?.code === "PGRST202") throw new HttpError(401, "Please sign in to continue.");
      if (guestError) dbError(guestError);
      after(notifyLowStock);
      return NextResponse.json(guest, { status: 201 });
    }
    const db = await supabase();
    const { data, error } = await db.rpc("create_order", {
      p_customer: customer,
      p_items: items,
      p_method: payment_method,
      p_key: idempotency_key,
    });
    if (error) dbError(error);
    // The order took stock; tell staff if anything has reached its reorder level.
    after(notifyLowStock);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
