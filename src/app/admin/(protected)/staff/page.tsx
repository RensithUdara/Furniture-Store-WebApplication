import Link from "next/link";
import { guardAdminPage, requireAdmin } from "@/lib/auth";
import { getStaff, getStaffRoles } from "@/services/staff";
import { StaffManager } from "@/components/admin/staff-manager";
export const metadata = { title: "Staff accounts" };
export default async function Staff() {
  // No area given: this page is for full administrators only.
  if (!(await guardAdminPage())) return null;
  const admin = await requireAdmin();
  const [staff, roles] = await Promise.all([getStaff(), getStaffRoles()]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Team</span>
          <h1>Staff accounts</h1>
          <p>Create logins for your team and decide what each person can do.</p>
        </div>
        <Link className="button button-outline" href="/admin/roles">
          Manage roles
        </Link>
      </div>
      {staff === null || roles === null ? (
        <div className="info-message">
          Staff accounts need the latest database update. Run{" "}
          <code>supabase/migrations/007_staff.sql</code> in the Supabase SQL editor.
        </div>
      ) : (
        <StaffManager staff={staff} roles={roles} currentId={admin.id} />
      )}
    </>
  );
}
