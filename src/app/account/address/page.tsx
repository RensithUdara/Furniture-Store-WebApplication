import { accountUser } from "@/lib/account";
import { AddressForm } from "@/components/account-forms";
import { AddressBook } from "@/components/account-extras";
import { getAddresses, getZones } from "@/services/shopping";
export const dynamic = "force-dynamic";
export const metadata = { title: "Saved addresses" };
export default async function AccountAddress() {
  const user = await accountUser("/account/address");
  const p = user.profile;
  const [addresses, zones] = await Promise.all([getAddresses(), getZones()]);
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>Saved addresses</h1>
        <p>
          Keep home, office and family addresses here. Checkout starts from your default and you can
          switch or edit it per order.
        </p>
      </div>
      {addresses ? (
        <AddressBook addresses={addresses} zones={zones} />
      ) : p?.address_line1 === undefined ? (
        // Neither the address book (migration 011) nor the single address (005) exists yet.
        <div className="info-message">Saved addresses are not available at the moment.</div>
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
