import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { allowedAreas, isStaff } from "@/lib/permissions";
import { AdminNav } from "@/components/admin-nav";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/admin");
  const profile = user.profile;
  const admin = profile?.role === "ADMIN";
  const areas = allowedAreas(profile);
  if (!isStaff(profile) || (!admin && !areas.length))
    return (
      <div className="empty-state">
        <h1>Store team only.</h1>
        <p>
          {isStaff(profile)
            ? "Your staff account has no permissions yet. Ask an administrator to give you a role."
            : "Your account does not have access to store management."}
        </p>
        <Link href="/" className="button">
          Back to the store
        </Link>
      </div>
    );
  return (
    <div className="container admin-shell">
      <AdminNav
        areas={areas}
        admin={admin}
        roleName={admin ? "Administrator" : profile?.staff_roles?.name || "Staff"}
      />
      <div className="admin-content">{children}</div>
    </div>
  );
}
