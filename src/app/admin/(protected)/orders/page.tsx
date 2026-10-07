import { getOrders } from "@/services/orders";
import { guardAdminPage } from "@/lib/auth";
import { OrderBrowser } from "@/components/admin/order-browser";
export const metadata = { title: "Manage orders" };
export default async function Orders() {
  if (!(await guardAdminPage("orders"))) return null;
  const orders = await getOrders(true);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Fulfilment</span>
          <h1>Orders</h1>
          <p>Review payments, confirm orders, and keep deliveries moving.</p>
        </div>
      </div>
      <OrderBrowser orders={orders} />
    </>
  );
}
