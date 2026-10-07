import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/admin-login";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false } };
// /admin is the store team's own entrance: staff who are signed in go straight to the dashboard.
export default async function Admin() {
  const user = await currentUser();
  if (user?.profile?.role === "ADMIN") redirect("/admin/dashboard");
  return <AdminLogin notAdmin={Boolean(user)} />;
}
