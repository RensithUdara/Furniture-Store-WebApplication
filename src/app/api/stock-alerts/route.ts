import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, requireUser } from "@/lib/auth";
import { serviceClient, supabase } from "@/lib/supabase/server";
import { stockAlertSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";
// "Tell me when it is back." Open to visitors as well as customers, so the row is written
// with the server key after the request has been validated and rate-limited.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await rateLimit("stock-alert-ip", clientIp(request), 10, 3600);
    const input = stockAlertSchema.parse(await readJson(request));
    const user = await currentUser();
    const email = (user?.email || input.email || "").toLowerCase();
    if (!email) throw new HttpError(400, "Enter the email address to notify.");
    const db = serviceClient();
    const { data: variant } = await db
      .from("product_variants")
      .select("id,stock_quantity,is_active")
      .eq("id", input.variant_id)
      .maybeSingle();
    if (!variant?.is_active) throw new HttpError(404, "That product is not available.");
    if (variant.stock_quantity > 0) throw new HttpError(409, "Good news: this is in stock now.");
    const { error } = await db
      .from("stock_alerts")
      .upsert(
        { variant_id: input.variant_id, email, user_id: user?.id || null, ready_at: null },
        { onConflict: "variant_id,email" },
      );
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
// Customers remove their own request; staff with the inventory permission can clear any.
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireUser();
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("stock_alerts").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
