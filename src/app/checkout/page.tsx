import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn, UserPlus, UserRound } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { payhere, serviceKey } from "@/lib/config";
import { CheckoutForm } from "@/components/checkout-form";
import { getSettings } from "@/services/settings";
import { getAddresses, getZones } from "@/services/shopping";
export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };
export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const [user, settings, zones] = await Promise.all([currentUser(), getSettings(), getZones()]);
  // Guest checkout arrives with migration 011 and needs the server key to create the order.
  const guestAllowed = settings?.return_window_days != null && Boolean(serviceKey());
  const guest = !user && (await searchParams).guest === "1";
  if (!user && !guestAllowed) redirect("/login?next=/checkout");
  const heading = (
    <div className="page-heading">
      <span className="eyebrow">The last little step</span>
      <h1>Make it yours.</h1>
      <p>We’ll take it from here.</p>
    </div>
  );
  if (!user && !guest)
    return (
      <div className="container page-space">
        {heading}
        <div className="checkout-choice">
          <Link href="/login?next=/checkout" className="choice-card primary">
            <LogIn size={26} />
            <strong>Sign in</strong>
            <span>Use your saved addresses, coupons and reward points, and track every order.</span>
          </Link>
          <Link href="/register?next=/checkout" className="choice-card">
            <UserPlus size={26} />
            <strong>Create an account</strong>
            <span>It takes a minute, and you start earning reward points with this order.</span>
          </Link>
          <Link href="/checkout?guest=1" className="choice-card">
            <UserRound size={26} />
            <strong>Continue as a guest</strong>
            <span>No account needed. You get a private link to follow your order.</span>
          </Link>
        </div>
      </div>
    );
  const addresses = user ? (await getAddresses()) || [] : [];
  return (
    <div className="container page-space">
      {heading}
      <CheckoutForm
        settings={settings}
        sandbox={payhere().mode === "sandbox"}
        guest={guest}
        zones={zones}
        addresses={addresses}
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
