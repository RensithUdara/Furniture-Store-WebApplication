import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { verifyNotification, type Notification } from "@/lib/payments/payhere";
import { apiError, HttpError, dbError } from "@/lib/http";
import { z } from "zod";
import { payhere } from "@/lib/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/x-www-form-urlencoded"))
      throw new HttpError(415, "Form encoding required.");
    const body = await request.text();
    if (body.length > 16000) throw new HttpError(413, "Request is too large.");
    const n = Object.fromEntries(new URLSearchParams(body)) as Notification;
    const { merchant, secret } = payhere();
    if (!merchant || !secret) throw new HttpError(503, "Payment service is not configured.");
    if (!verifyNotification(n, merchant, secret))
      throw new HttpError(400, "Invalid payment notification.");
    z.uuid().parse(n.order_id);
    const db = serviceClient();
    const { error } = await db.rpc("record_payment", {
      p_order: n.order_id,
      p_payment: n.payment_id,
      p_status: Number(n.status_code),
      p_amount: n.payhere_amount,
    });
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
