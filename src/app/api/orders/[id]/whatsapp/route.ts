import { NextResponse } from "next/server";
import { getOrder } from "@/services/orders";
import { whatsappUrl } from "@/lib/whatsapp";
import { apiError, HttpError } from "@/lib/http";
import { z } from "zod";
import { whatsappNumber } from "@/lib/config";
export async function GET(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder(z.uuid().parse((await params).id));
    if (!order) throw new HttpError(404, "Order not found.");
    if (order.payment_method !== "WHATSAPP" || order.order_status === "CANCELLED")
      throw new HttpError(409, "This order cannot be sent to WhatsApp.");
    return NextResponse.json({ url: whatsappUrl(whatsappNumber(), order) });
  } catch (e) {
    return apiError(e);
  }
}
