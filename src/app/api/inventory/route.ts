import { NextResponse, after } from "next/server";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { inventorySchema } from "@/lib/validation";
import { notifyLowStock } from "@/services/admin";
import { apiError, checkOrigin, dbError, readJson, HttpError } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("inventory");
    const { id, stock_quantity, previous, reorder_level, note } = inventorySchema.parse(
      await readJson(request),
    );
    const db = await supabase();
    if (reorder_level !== undefined) {
      const { error } = await db.from("product_variants").update({ reorder_level }).eq("id", id);
      if (error) dbError(error);
    }
    if (stock_quantity !== undefined) {
      // adjust_stock records the change in the stock history (migration 013).
      const { error } = await db.rpc("adjust_stock", {
        p_variant: id,
        p_quantity: stock_quantity,
        p_previous: previous ?? null,
        p_reason: "ADJUSTMENT",
        p_note: note || "",
      });
      if (error?.code === "PGRST202") {
        // Before migration 013: the same change, without a history entry.
        const { data, error: plain } = await db
          .from("product_variants")
          .update({ stock_quantity })
          .eq("id", id)
          .eq("stock_quantity", previous ?? -1)
          .select("id");
        if (plain) dbError(plain);
        if (!data?.length)
          throw new HttpError(409, "Stock changed while you were editing. Refresh and try again.");
      } else if (error) {
        if (/Stock changed/.test(error.message)) throw new HttpError(409, error.message);
        dbError(error);
      }
    }
    after(notifyLowStock);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
