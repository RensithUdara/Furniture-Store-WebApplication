import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { getOrders } from "@/services/orders";
import { payhere, whatsappNumber } from "@/lib/config";
export async function GET() {
  try {
    return NextResponse.json(await getOrders());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireUser();
    const { items, payment_method, idempotency_key, ...customer } = checkoutSchema.parse(
      await readJson(request),
    );
    if (payment_method === "PAYHERE" && !payhere().ready)
      throw new HttpError(503, "Online payment is not yet available. Please choose WhatsApp.");
    if (payment_method === "WHATSAPP" && !/^[1-9]\d{7,14}$/.test(whatsappNumber()))
      throw new HttpError(503, "WhatsApp ordering is not yet configured.");
    const db = await supabase();
    const { data, error } = await db.rpc("create_order", {
      p_customer: customer,
      p_items: items,
      p_method: payment_method,
      p_key: idempotency_key,
    });
    if (error) dbError(error);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
