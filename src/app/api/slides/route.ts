import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getSlides } from "@/services/slides";
import { slideSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
export async function GET() {
  try {
    return NextResponse.json(await getSlides());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("promos");
    const input = slideSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.from("promo_slides").upsert(input).select().single();
    if (error) dbError(error);
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("promos");
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("promo_slides").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
