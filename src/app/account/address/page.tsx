import { accountUser } from "@/lib/account";
import { AddressForm } from "@/components/account-forms";
export const dynamic = "force-dynamic";
export const metadata = { title: "Saved address" };
export default async function AccountAddress() {
  const user = await accountUser("/account/address");
  const p = user.profile;
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>Saved address</h1>
        <p>Used to fill in the delivery address at checkout. You can still change it per order.</p>
      </div>
      {/* The address columns arrive with migration 005; until then there is nowhere to save to. */}
      {p?.address_line1 === undefined ? (
        <div className="info-message">
          Saved addresses are not switched on yet. The store owner needs to run{" "}
          <code>supabase/migrations/005_account.sql</code>.
        </div>
      ) : (
        <section className="form-card">
          <h2>Delivery address</h2>
          <AddressForm
            address={{
              address_line1: p.address_line1,
              address_line2: p.address_line2,
              city: p.city,
              postal_code: p.postal_code,
            }}
          />
        </section>
      )}
    </>
  );
}
