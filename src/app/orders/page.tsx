import { redirect } from "next/navigation";
// Order history lives in the account area; individual orders stay at /orders/[id].
export default function OrdersRedirect() {
  redirect("/account/orders");
}
