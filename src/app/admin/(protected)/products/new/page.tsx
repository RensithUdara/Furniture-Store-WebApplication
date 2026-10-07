import { guardAdminPage } from "@/lib/auth";
import { getCategories } from "@/services/catalog";
import { ProductForm } from "@/components/admin/product-form";
export const metadata = { title: "Add product" };
export default async function NewProduct() {
  if (!(await guardAdminPage("products"))) return null;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Add product</h1>
          <p>Bring a new piece into the collection.</p>
        </div>
      </div>
      <ProductForm categories={await getCategories(true)} />
    </>
  );
}
