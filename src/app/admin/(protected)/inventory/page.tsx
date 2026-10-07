import Link from "next/link";
import { History } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { getStockAlerts } from "@/services/shopping";
import { InventoryTable } from "@/components/admin/inventory-table";
import { StockAlertList } from "@/components/account-extras";
export const metadata = { title: "Manage inventory" };
export default async function Inventory() {
  if (!(await guardAdminPage("inventory"))) return null;
  const [products, alerts] = await Promise.all([getProducts(true), getStockAlerts()]);
  const ready = alerts.filter((a) => a.ready_at).length;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Stock control</span>
          <h1>Inventory</h1>
          <p>Stock is available-to-sell inventory, excluding units already reserved by orders.</p>
        </div>
        <Link className="button button-outline" href="/admin/inventory/history">
          <History size={16} /> Stock history
        </Link>
      </div>
      <InventoryTable products={products} />
      {alerts.length > 0 && (
        <>
          <div className="admin-section-title">
            <h2>Customers waiting for stock</h2>
          </div>
          <p className="muted">
            {ready > 0
              ? `${ready} ${ready === 1 ? "request is" : "requests are"} for items now back in stock. Contact the customer, then remove the request.`
              : "These customers asked to be told when a sold-out finish returns. Restocking it marks their request as ready."}
          </p>
          <StockAlertList alerts={alerts} admin />
        </>
      )}
    </>
  );
}
