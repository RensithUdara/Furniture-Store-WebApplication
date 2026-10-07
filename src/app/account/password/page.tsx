import { redirect } from "next/navigation";
// Kept so older links and reset emails keep working; passwords are changed under Security.
export default function PasswordRedirect() {
  redirect("/account/security");
}
