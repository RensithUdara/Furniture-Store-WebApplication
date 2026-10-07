import { guardAdminPage } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { InventoryTable } from "@/components/admin/inventory-table";
export const metadata = { title: "Manage inventory" };
export default async function Inventory() {
  if (!(await guardAdminPage())) return null;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Stock control</span>
          <h1>Inventory</h1>
          <p>Stock is available-to-sell inventory, excluding units already reserved by orders.</p>
        </div>
      </div>
      <InventoryTable products={await getProducts(true)} />
    </>
  );
}
