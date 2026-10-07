import { accountUser } from "@/lib/account";
import { ProfileForm } from "@/components/account-forms";
import { dateOnly } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };
export default async function AccountProfile() {
  const user = await accountUser("/account/profile");
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>Profile</h1>
        <p>Your name and phone number are used to pre-fill checkout.</p>
      </div>
      <section className="form-card">
        <h2>Personal details</h2>
        <ProfileForm name={user.profile?.name || ""} phone={user.profile?.phone || ""} />
      </section>
      <section className="form-card">
        <h2>Account</h2>
        <dl className="spec-list">
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Customer since</dt>
            <dd>{dateOnly(user.created_at)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
