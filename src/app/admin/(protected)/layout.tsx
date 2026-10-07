import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/admin");
  if (user.profile?.role !== "ADMIN")
    return (
      <div className="empty-state">
        <h1>Store team only.</h1>
        <p>Your account does not have access to store management.</p>
        <Link href="/admin" className="button">
          Admin sign in
        </Link>
      </div>
    );
  return (
    <div className="container admin-shell">
      <AdminNav />
      <div className="admin-content">{children}</div>
    </div>
  );
}
