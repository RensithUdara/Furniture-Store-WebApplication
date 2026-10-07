import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getCoupons } from "@/services/rewards";
import { couponSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Admin only. Customers never list coupons; they test a code through /api/coupons/preview.
export async function GET() {
  try {
    return NextResponse.json((await getCoupons()) || []);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const input = couponSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.from("coupons").upsert(input).select().single();
    if (error?.code === "23505") throw new HttpError(409, "That coupon code already exists.");
    if (error) dbError(error);
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("coupons").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
