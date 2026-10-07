import { currentUser } from "@/lib/auth";
import { AccountNav } from "@/components/account-nav";
export const dynamic = "force-dynamic";
// Shared shell for the customer account area: a sidebar with the signed-in user and section links.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  // Signed-out visitors: each page redirects to sign-in with its own return address.
  if (!user) return <>{children}</>;
  return (
    <div className="container page-space account-shell">
      <AccountNav
        name={user.profile?.name || ""}
        email={user.email || ""}
        admin={user.profile?.role === "ADMIN"}
      />
      <div className="account-main">{children}</div>
    </div>
  );
}
