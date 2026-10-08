import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getWishlistIds } from "@/services/rewards";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
const body = z.object({ product_id: z.uuid() });
export async function GET() {
  try {
    await requireUser();
    return NextResponse.json((await getWishlistIds()) || []);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { product_id } = body.parse(await readJson(request));
    const db = await supabase();
    // Saving the same product twice is not an error: the second insert is simply skipped.
    // (Skipped, not updated: customers may insert and delete wishlist rows but not update
    // them, and an "insert or update" needs the update permission even when nothing changes.)
    const { error } = await db
      .from("wishlist_items")
      .upsert(
        { user_id: user.id, product_id },
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
    // 23503: the product was removed while the page was open.
    if (error?.code === "23503") throw new HttpError(404, "That product is no longer available.");
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { product_id } = body.parse(await readJson(request));
    const db = await supabase();
    const { error } = await db
      .from("wishlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", product_id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
