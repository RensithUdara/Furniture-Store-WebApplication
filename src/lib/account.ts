import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import type { Order } from "@/types";

// Every account page calls this itself. The shared layout is not re-rendered when moving
// between account pages, so the layout alone must never be the access check.
export async function accountUser(next: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
export const isActiveOrder = (o: Order) => !["DELIVERED", "CANCELLED"].includes(o.order_status);
export function orderStats(orders: Order[]) {
  const live = orders.filter((o) => o.order_status !== "CANCELLED");
  return {
    total: orders.length,
    active: orders.filter(isActiveOrder).length,
    delivered: orders.filter((o) => o.order_status === "DELIVERED").length,
    // Money actually received: verified online payments and cash collected on delivery.
    paid: live
      .filter((o) => o.payment_status === "PAID")
      .reduce((a, o) => a + Number(o.total_amount), 0),
  };
}
