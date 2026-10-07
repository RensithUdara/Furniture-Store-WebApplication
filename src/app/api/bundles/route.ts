import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getBundles } from "@/services/catalog";
import { bundleSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Room sets: products that earn a discount when ordered together. The discount itself is
// applied by the database when an order is saved (migration 012).
export async function GET() {
  try {
    return NextResponse.json((await getBundles()) || []);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const input = bundleSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.rpc("save_bundle", { p: input });
    if (error?.code === "PGRST202")
      throw new HttpError(503, "Room sets need migration 012_catalogue.sql.");
    if (error?.code === "23503") throw new HttpError(400, "One of those products no longer exists.");
    if (error) dbError(error);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("bundles").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
