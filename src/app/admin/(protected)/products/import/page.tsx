import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { ImportTool } from "@/components/admin/import-tool";
export const metadata = { title: "Import products" };
export default async function ImportProducts() {
  if (!(await guardAdminPage("products"))) return null;
  const products = await getProducts(true);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Import from a spreadsheet</h1>
          <p>Add many products at once, or change prices, stock and details in bulk.</p>
        </div>
        <Link className="button button-outline" href="/admin/products">
          <ArrowLeft size={16} /> Products
        </Link>
      </div>
      <ImportTool slugs={products.map((p) => p.slug)} />
    </>
  );
}
