import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { bundleDiscount } from "@/lib/bundles";
import { getBundles } from "@/services/catalog";
import { getFlashSales } from "@/services/marketing";
import { flashFor, flashPrice } from "@/lib/flash";
const body = z.object({
  code: z.string().trim().min(3).max(30),
  items: z
    .array(z.object({ variant_id: z.uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(30),
});
// Tells a signed-in customer what a code would take off their cart. The subtotal is rebuilt
// from database prices, and the order function applies the coupon again when the order is saved.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    // Signed-in users only, so the limit follows the account and cannot be dodged by changing address.
    await rateLimit("coupon-user", user.id, 12, 600);
    const { code, items } = body.parse(await readJson(request));
    const db = await supabase();
    const { data: variants, error } = await db
      .from("product_variants")
      .select("id,price,product_id")
      .in(
        "id",
        items.map((i) => i.variant_id),
      );
    if (error) dbError(error);
    // Start from the prices the order itself will use: flash-sale prices while a sale runs.
    const sales = (await getFlashSales()) || [];
    const lines = items.flatMap((i) => {
      const v = variants?.find((v) => v.id === i.variant_id);
      if (!v) return [];
      const sale = flashFor(v.product_id, sales);
      const price = sale ? flashPrice(Number(v.price), sale.discount_percent) : Number(v.price);
      return [{ product_id: v.product_id as string, quantity: i.quantity, price }];
    });
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    // A coupon applies to what is left after any room-set discount, as it does on the order.
    const sets = bundleDiscount(lines, (await getBundles()) || []).amount;
    const { data, error: rpcError } = await db.rpc("preview_coupon", {
      p_code: code,
      p_subtotal: Math.max(0, subtotal - sets),
    });
    // PGRST202: the function does not exist until migration 006 has been run.
    if (rpcError?.code === "PGRST202") throw new HttpError(503, "Coupons are not available yet.");
    if (rpcError) dbError(rpcError);
    return NextResponse.json({ code: code.toUpperCase(), discount: Number(data) });
  } catch (e) {
    return apiError(e);
  }
}
