import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getSettings } from "@/services/settings";
import { settingsSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
export async function GET() {
  try {
    const settings = await getSettings();
    if (!settings) throw new HttpError(404, "Store settings have not been set up.");
    return NextResponse.json(settings);
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("settings");
    const input = settingsSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db
      .from("store_settings")
      .update(input)
      .eq("id", true)
      .select("id");
    if (error) dbError(error);
    if (!data?.length)
      throw new HttpError(404, "Run supabase/migrations/003_settings.sql to enable settings.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
