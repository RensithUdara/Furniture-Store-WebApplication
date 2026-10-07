import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { allowedAreas, isStaff } from "@/lib/permissions";
import { AdminShell } from "@/components/admin-shell";
export const dynamic = "force-dynamic";
// The admin panel is never shown in search results.
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/admin");
  const profile = user.profile;
  const admin = profile?.role === "ADMIN";
  const areas = allowedAreas(profile);
  if (!isStaff(profile) || (!admin && !areas.length))
    return (
      <div className="admin-denied">
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
      </div>
    );
  return (
    <AdminShell
      areas={areas}
      admin={admin}
      roleName={admin ? "Administrator" : profile?.staff_roles?.name || "Staff"}
      name={profile?.name || ""}
      email={user.email || ""}
    >
      {children}
    </AdminShell>
  );
}
