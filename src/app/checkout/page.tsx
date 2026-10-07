import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { isConfigured, payhere } from "@/lib/config";
import { CheckoutForm } from "@/components/checkout-form";
import { getSettings } from "@/services/settings";
export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };
export default async function Checkout() {
  const configured = isConfigured();
  const user = await currentUser();
  if (configured && !user) redirect("/login?next=/checkout");
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">The last little step</span>
        <h1>Make it yours.</h1>
        <p>We’ll take it from here.</p>
      </div>
      <CheckoutForm
        settings={await getSettings()}
        sandbox={payhere().mode === "sandbox"}
        name={user?.profile?.name}
        email={user?.email}
        phone={user?.profile?.phone}
        points={Number(user?.profile?.loyalty_points || 0)}
        address={
          user?.profile?.address_line1
            ? {
                line1: user.profile.address_line1,
                line2: user.profile.address_line2,
                city: user.profile.city,
                postal: user.profile.postal_code,
              }
            : undefined
        }
      />
    </div>
  );
}
