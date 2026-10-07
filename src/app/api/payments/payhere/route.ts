import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/services/orders";
import { checkoutHash } from "@/lib/payments/payhere";
import { apiError, checkOrigin, HttpError, readJson } from "@/lib/http";
import { z } from "zod";
import { appUrl, payhere } from "@/lib/config";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const order = await getOrder(id);
    if (!order || order.user_id !== user.id) throw new HttpError(404, "Order not found.");
    if (
      order.payment_method !== "PAYHERE" ||
      order.order_status === "CANCELLED" ||
      ["PAID", "CHARGEDBACK"].includes(order.payment_status)
    )
      throw new HttpError(409, "This order cannot be paid online.");
    const { merchant, secret, action, ready } = payhere();
    if (!ready) throw new HttpError(503, "Online payment is not configured.");
    const base = appUrl();
    const amount = Number(order.total_amount).toFixed(2);
    const [first, ...last] = order.customer_name.split(" ");
    return NextResponse.json({
      action,
      fields: {
        merchant_id: merchant,
        return_url: `${base}/orders/${id}?payment=returned`,
        cancel_url: `${base}/orders/${id}?payment=cancelled`,
        notify_url: `${base}/api/payments/notification`,
        first_name: first,
        last_name: last.join(" ") || first,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.shipping_address,
        city: order.city || "Store pickup",
        country: "Sri Lanka",
        order_id: id,
        items: order.order_number,
        currency: "LKR",
        amount,
        hash: checkoutHash(merchant, id, amount, secret),
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
