import { PRIVATE } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { getOrder, getOrderEvents } from "@/services/orders";
import { OrderDetail } from "@/components/order-detail";
import { getReturn } from "@/services/shopping";
import { getSettings } from "@/services/settings";
export const dynamic = "force-dynamic";
export const metadata = { title: "Order details", robots: PRIVATE };
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; payment?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await currentUser())) redirect(`/login?next=/orders/${id}`);
  const order = await getOrder(id);
  if (!order) notFound();
  const q = await searchParams;
  return (
    <div className="container page-space">
      <OrderDetail
        order={order}
        settings={await getSettings()}
        events={await getOrderEvents(id)}
        returnRequest={await getReturn(id)}
        created={q.created === "1"}
        returned={Boolean(q.payment)}
      />
    </div>
  );
}
