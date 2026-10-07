import { guardAdminPage } from "@/lib/auth";
import { getCategories } from "@/services/catalog";
import { CategoryForm } from "@/components/admin/category-form";
export const metadata = { title: "Manage categories" };
export default async function Categories() {
  if (!(await guardAdminPage())) return null;
  const categories = await getCategories(true);
  // Two levels only: a category that already has sub-categories cannot itself become one.
  // parent_id exists once migration 004 has run; before that every category is top-level.
  const migrated = categories.some((c) => c.parent_id !== undefined);
  const parents = migrated ? categories.filter((c) => !c.parent_id) : [];
  const hasChildren = (id: string) => categories.some((c) => c.parent_id === id);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Categories</h1>
          <p>Inactive categories and their products are hidden from customers.</p>
        </div>
      </div>
      <div className="category-edit-grid">
        <CategoryForm parents={parents} />
        {categories.map((c) => (
          <CategoryForm key={c.id} category={c} parents={hasChildren(c.id) ? [] : parents} />
        ))}
      </div>
    </>
  );
}
