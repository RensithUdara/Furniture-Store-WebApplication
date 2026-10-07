import { notFound } from "next/navigation";
import { guardAdminPage } from "@/lib/auth";
import { getCategories, getProduct } from "@/services/catalog";
import { ProductForm } from "@/components/admin/product-form";
export const metadata = { title: "Edit product" };
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  if (!(await guardAdminPage("products"))) return null;
  const [product, categories] = await Promise.all([
    getProduct((await params).id, true),
    getCategories(true),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog · Edit product</span>
          <h1>{product.name}</h1>
          <p>Refine the details, finishes, and imagery.</p>
        </div>
      </div>
      <ProductForm product={product} categories={categories} extras={product.rooms !== undefined} />
    </>
  );
}
