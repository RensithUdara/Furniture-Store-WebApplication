import Link from "next/link";
import { guardAdminPage } from "@/lib/auth";
import { getStaff, getStaffRoles } from "@/services/staff";
import { RoleForm } from "@/components/admin/role-form";
export const metadata = { title: "Roles and permissions" };
export default async function Roles() {
  // No area given: this page is for full administrators only.
  if (!(await guardAdminPage())) return null;
  const [roles, staff] = await Promise.all([getStaffRoles(), getStaff()]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Team</span>
          <h1>Roles and permissions</h1>
          <p>
            A role is a named set of admin areas. Administrators always have every area, plus staff
            accounts and roles, which no role can grant.
          </p>
        </div>
        <Link className="button button-outline" href="/admin/staff">
          Staff accounts
        </Link>
      </div>
      {roles === null ? (
        <div className="info-message">
          Roles need the latest database update. Run <code>supabase/migrations/007_staff.sql</code>{" "}
          in the Supabase SQL editor.
        </div>
      ) : (
        <div className="category-edit-grid">
          <RoleForm />
          {roles.map((r) => (
            <RoleForm
              key={r.id}
              role={r}
              members={(staff || []).filter((m) => m.staff_role_id === r.id).length}
            />
          ))}
        </div>
      )}
    </>
  );
}
