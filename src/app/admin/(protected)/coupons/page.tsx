import { guardAdminPage } from "@/lib/auth";
import { getCoupons } from "@/services/rewards";
import { CouponForm } from "@/components/admin/coupon-form";
export const metadata = { title: "Coupons" };
export default async function Coupons() {
  if (!(await guardAdminPage("coupons"))) return null;
  const coupons = await getCoupons();
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Promotions</span>
          <h1>Coupons</h1>
          <p>
            Discount codes customers enter at checkout. The database checks every rule again when
            the order is saved.
          </p>
        </div>
      </div>
      {coupons === null ? (
        <div className="info-message">
          Coupons need the latest database update. Run{" "}
          <code>supabase/migrations/006_rewards.sql</code> in the Supabase SQL editor.
        </div>
      ) : (
        <div className="category-edit-grid">
          <CouponForm />
          {coupons.map((c) => (
            <CouponForm key={c.id} coupon={c} />
          ))}
        </div>
      )}
    </>
  );
}
