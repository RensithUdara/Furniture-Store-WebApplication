import { notFound } from "next/navigation";
import { z } from "zod";
import { guardAdminPage } from "@/lib/auth";
import { getOrder, getPaymentEvents } from "@/services/orders";
import { OrderDetail } from "@/components/order-detail";
export const metadata = { title: "Manage order" };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await guardAdminPage())) return null;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  return <OrderDetail order={order} admin payments={await getPaymentEvents(id)} />;
}
