import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { homeFor } from "@/lib/permissions";
import { AdminLogin } from "@/components/admin/admin-login";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false } };
// /admin is the store team's own entrance: staff who are signed in go straight to the dashboard.
export default async function Admin() {
  const user = await currentUser();
  // Staff land on the first area their role allows.
  const home = homeFor(user?.profile);
  if (home) redirect(home);
  return <AdminLogin notAdmin={Boolean(user)} />;
}
