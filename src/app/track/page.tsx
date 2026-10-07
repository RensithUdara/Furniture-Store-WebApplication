import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { getOrders } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { TrackForm } from "@/components/track-form";
import { OrderCard } from "@/components/order-history";
export const dynamic = "force-dynamic";
export const metadata = { title: "Track your order" };
export default async function Track() {
  const [user, settings] = await Promise.all([currentUser(), getSettings()]);
  // Signed-in customers see their orders in progress straight away; anyone can use the lookup.
  const active = user
    ? (await getOrders()).filter((o) => !["DELIVERED", "CANCELLED"].includes(o.order_status))
    : [];
  return (
    <div className="container page-space track-page">
      <div className="page-heading">
        <span className="eyebrow">Order tracking</span>
        <h1>Track your order</h1>
        <p>Enter your order number and the phone number or email you ordered with.</p>
      </div>
      <TrackForm pickupAddress={settings?.pickup_address} />
      {active.length > 0 && (
        <section className="track-mine">
          <div className="admin-section-title">
            <h2>Your orders in progress</h2>
            <Link className="text-link" href="/account/orders">
              All orders <ArrowRight size={15} />
            </Link>
          </div>
          <div className="order-list">
            {active.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
      {!user && (
        <p className="track-hint">
          Have an account? <Link href="/login?next=/account/orders">Sign in</Link> to see all your
          orders, download bills, and buy again.
        </p>
      )}
    </div>
  );
}
