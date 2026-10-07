import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { flashSaleSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Flash sales are part of promotions, so they use the coupons permission. The sale price is
// applied by the database when an order is saved (migration 014).
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("coupons");
    const input = flashSaleSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.rpc("save_flash_sale", { p: input });
    if (error?.code === "PGRST202") throw new HttpError(503, "Flash sales are not available yet.");
    if (error?.code === "23503")
      throw new HttpError(400, "One of those products no longer exists.");
    if (error) dbError(error);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("coupons");
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("flash_sales").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
