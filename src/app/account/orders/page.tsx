import { PRIVATE } from "@/lib/seo";
import { accountUser } from "@/lib/account";
import { getOrders } from "@/services/orders";
import { OrderHistory } from "@/components/order-history";
export const dynamic = "force-dynamic";
export const metadata = { title: "My orders", robots: PRIVATE };
export default async function AccountOrders() {
  await accountUser("/account/orders");
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>My orders</h1>
        <p>Follow each order from placed to delivered, or buy a favourite again.</p>
      </div>
      <OrderHistory orders={await getOrders()} />
    </>
  );
}
