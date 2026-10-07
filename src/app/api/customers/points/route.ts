import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { pointsAdjustSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Adds or removes reward points by hand. The database function checks the permission again,
// refuses to take a balance below zero, and writes the adjustment to the customer's ledger.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("orders");
    const input = pointsAdjustSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.rpc("adjust_points", {
      p_user: input.user_id,
      p_points: input.points,
      p_note: input.note,
    });
    if (error?.code === "PGRST202")
      throw new HttpError(503, "Point adjustments are not available yet.");
    if (error) dbError(error);
    return NextResponse.json({ balance: data });
  } catch (e) {
    return apiError(e);
  }
}
