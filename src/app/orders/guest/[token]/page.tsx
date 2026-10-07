import { notFound } from "next/navigation";
import { getGuestOrder } from "@/services/shopping";
import { getSettings } from "@/services/settings";
import { OrderDetail } from "@/components/order-detail";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };
// A guest's order page. The long random token in the address is what grants access, so it is
// never shown to search engines and should be treated like a private link.
export default async function GuestOrder({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ created?: string; payment?: string }>;
}) {
  const { token } = await params;
  const order = await getGuestOrder(token);
  if (!order) notFound();
  const q = await searchParams;
  return (
    <div className="container page-space">
      <div className="info-message">
        <strong>Save this page.</strong> You checked out as a guest, so this private link is how you
        get back to your order. You can also use Track order with your order number.
      </div>
      <OrderDetail
        order={order}
        settings={await getSettings()}
        created={q.created === "1"}
        returned={Boolean(q.payment)}
        guestToken={token}
      />
    </div>
  );
}
