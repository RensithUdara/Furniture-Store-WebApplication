import { ShieldCheck } from "lucide-react";
import { accountUser } from "@/lib/account";
import { PasswordForm } from "@/components/account-forms";
import { LogoutButton } from "@/components/logout-button";
import { dateTime } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Security" };
// Also the landing page for an emailed password-reset link, which signs the user in first.
export default async function AccountSecurity() {
  const user = await accountUser("/account/security");
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>Security</h1>
        <p>Manage your password and where you are signed in.</p>
      </div>
      <section className="form-card">
        <h2>Change password</h2>
        <PasswordForm />
      </section>
      <section className="form-card">
        <h2>Sign-in details</h2>
        <dl className="spec-list">
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          {user.last_sign_in_at && (
            <div>
              <dt>Last signed in</dt>
              <dd>{dateTime(user.last_sign_in_at)}</dd>
            </div>
          )}
        </dl>
        <p className="security-note">
          <ShieldCheck size={16} /> Your password is stored as a secure hash by our authentication
          provider. Nobody at the store can see it.
        </p>
        <LogoutButton />
      </section>
    </>
  );
}
