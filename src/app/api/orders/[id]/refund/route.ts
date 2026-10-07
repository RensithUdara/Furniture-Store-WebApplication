import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { refundSchema } from "@/lib/validation";
import { payhereRefund } from "@/lib/payments/refund";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Refunds a paid order. "PAYHERE" sends the whole payment back to the customer's card through
// PayHere's Refund API and then records it. "MANUAL" only records a refund staff have already
// made another way (cash, bank transfer), for any amount up to what is still refundable.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    await requirePermission("orders");
    const id = z.uuid().parse((await params).id);
    const input = refundSchema.parse(await readJson(request));
    const db = await supabase();
    const { data: order, error } = await db
      .from("orders")
      .select("id,order_number,payment_method,payment_status,total_amount,refunded_amount")
      .eq("id", id)
      .maybeSingle();
    // 42703: the refunded_amount column arrives with migration 013.
    if (error?.code === "42703") throw new HttpError(503, "Refunds are not available yet.");
    if (error) dbError(error);
    if (!order) throw new HttpError(404, "Order not found.");
    if (order.payment_status !== "PAID")
      throw new HttpError(409, "Only a paid order can be refunded.");
    const remaining = Number(order.total_amount) - Number(order.refunded_amount);
    if (remaining <= 0) throw new HttpError(409, "This order has already been refunded in full.");
    let amount = input.amount ?? remaining,
      reference = input.reference || "";
    if (input.method === "PAYHERE") {
      if (order.payment_method !== "PAYHERE")
        throw new HttpError(409, "This order was not paid through PayHere.");
      if (Number(order.refunded_amount) > 0)
        throw new HttpError(
          409,
          "Part of this order was already refunded. Record the rest manually.",
        );
      const { data: payment } = await db
        .from("payment_events")
        .select("payment_id")
        .eq("order_id", id)
        .eq("status_code", 2)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!payment)
        throw new HttpError(409, "No successful PayHere payment was found for this order.");
      amount = Number(order.total_amount);
      reference = payment.payment_id;
      // Money moves here. If the next step fails, the message says so plainly.
      await payhereRefund(
        payment.payment_id,
        input.note || `Refund for order ${order.order_number}`,
      );
    }
    const { error: saveError } = await db.rpc("record_refund", {
      p_order: id,
      p_amount: amount,
      p_method: input.method,
      p_reference: reference,
      p_note: input.note || "",
    });
    if (saveError) {
      if (input.method === "PAYHERE")
        throw new HttpError(
          500,
          `PayHere refunded the payment, but it could not be recorded here (${saveError.message}). Record it as a manual refund with reference ${reference}; do not refund through PayHere again.`,
        );
      dbError(saveError);
    }
    return NextResponse.json({ ok: true, amount });
  } catch (e) {
    return apiError(e);
  }
}
