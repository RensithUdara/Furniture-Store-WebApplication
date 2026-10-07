import { redirect } from "next/navigation";
// Kept so old links keep working; the admin sign-in lives at /admin.
export default function AdminLoginRedirect() {
  redirect("/admin");
}
