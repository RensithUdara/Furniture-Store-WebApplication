import type { Order } from "@/types";
import { dateTime, money } from "@/lib/format";

// Lines are grouped per product so several finishes of one piece read as a single entry,
// e.g. "Haven Sofa: Forest × 2, Oatmeal × 1".
export function whatsappMessage(order: Order) {
  const pickup = order.fulfillment_method === "PICKUP";
  const groups = new Map<string, Order["order_items"]>();
  for (const item of order.order_items)
    groups.set(item.product_name, [...(groups.get(item.product_name) || []), item]);
  return [
    "Hello Forma & Co.,",
    `I'd like to confirm order *${order.order_number}*.`,
    "",
    "*ORDER ITEMS*",
    ...[...groups].map(
      ([name, items], i) =>
        `${i + 1}. ${name}\n` +
        items
          .map(
            (item) =>
              `   • ${item.variant_details} × ${item.quantity} @ ${money(item.unit_price)} = ${money(item.subtotal)}`,
          )
          .join("\n"),
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    pickup
      ? "Store pickup: Free"
      : `Delivery: ${Number(order.delivery_fee) ? money(order.delivery_fee) : "Free"}`,
    ...(Number(order.bundle_discount) > 0
      ? [`Room set saving (${order.bundle_names}): -${money(Number(order.bundle_discount))}`]
      : []),
    ...(Number(order.discount_amount) > 0
      ? [`Coupon ${order.coupon_code}: -${money(Number(order.discount_amount))}`]
      : []),
    ...(Number(order.points_discount) > 0
      ? [`Reward points (${order.points_redeemed}): -${money(Number(order.points_discount))}`]
      : []),
    `*Total: ${money(order.total_amount)}*`,
    "",
    "*CUSTOMER DETAILS*",
    `Name: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Email: ${order.customer_email}`,
    pickup
      ? `Store pickup: ${order.pickup_at ? dateTime(order.pickup_at) : "time to be confirmed"}`
      : `Address: ${order.shipping_address}, ${order.city}, ${order.postal_code}`,
    "",
    "Please confirm availability and payment arrangements. Thank you.",
  ].join("\n");
}
export function whatsappUrl(number: string, order: Order) {
  if (!/^[1-9]\d{7,14}$/.test(number))
    throw new Error("The store WhatsApp number is not configured.");
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(order))}`;
}
