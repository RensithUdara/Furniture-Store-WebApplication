import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { apiError, checkOrigin, dbError, readJson, HttpError } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const { id, stock_quantity, previous } = z
      .object({
        id: z.uuid(),
        stock_quantity: z.number().int().min(0).max(100000),
        previous: z.number().int().min(0),
      })
      .parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db
      .from("product_variants")
      .update({ stock_quantity })
      .eq("id", id)
      .eq("stock_quantity", previous)
      .select("id");
    if (error) dbError(error);
    if (!data?.length)
      throw new HttpError(409, "Stock changed while you were editing. Refresh and try again.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
