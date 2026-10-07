import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getZones } from "@/services/shopping";
import { zonesSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
export async function GET() {
  try {
    return NextResponse.json(await getZones());
  } catch (e) {
    return apiError(e);
  }
}
// Saves the whole delivery-time table at once.
export async function PUT(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("settings");
    const { zones } = zonesSchema.parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("delivery_zones").upsert(zones);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
