import { guardAdminPage } from "@/lib/auth";
import { getCategories } from "@/services/catalog";
import { CategoryManager } from "@/components/admin/managers";
export const metadata = { title: "Manage categories" };
export default async function Categories() {
  if (!(await guardAdminPage("categories"))) return null;
  const categories = await getCategories(true);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Categories</h1>
          <p>Inactive categories and their products are hidden from customers.</p>
        </div>
      </div>
      <CategoryManager categories={categories} />
    </>
  );
}
