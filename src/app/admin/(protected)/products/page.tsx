import Link from "next/link";
import { Plus } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { ProductTable } from "@/components/admin/product-table";
export const metadata = { title: "Manage products" };
export default async function Products() {
  if (!(await guardAdminPage())) return null;
  const products = await getProducts(true);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Products</h1>
          <p>
            {products.length} products · {products.filter((p) => p.is_active).length} visible in
            store. Hidden products keep their order history.
          </p>
        </div>
        <Link className="button" href="/admin/products/new">
          <Plus size={16} /> Add product
        </Link>
      </div>
      <ProductTable products={products} />
    </>
  );
}
