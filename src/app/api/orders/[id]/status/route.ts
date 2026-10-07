import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { statusSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { z } from "zod";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    await requireUser();
    const id = z.uuid().parse((await params).id);
    const { status, tracking_number, courier } = statusSchema.parse(await readJson(request));
    const db = await supabase();
    // Tracking details are saved first, so an order is never shown as shipped without the
    // details the admin typed. The database function checks the "orders" permission itself.
    if (tracking_number !== undefined || courier !== undefined) {
      if (status !== "SHIPPED")
        throw new HttpError(400, "Tracking details belong to a shipped order.");
      const { error: trackingError } = await db.rpc("set_order_tracking", {
        p_id: id,
        p_tracking: tracking_number || "",
        p_courier: courier || "",
      });
      // PGRST202: the function does not exist until migration 008 has been run. Blank details
      // can still ship; anything typed would be lost, so say so instead.
      if (trackingError?.code === "PGRST202") {
        if (tracking_number || courier)
          throw new HttpError(
            503,
            "Tracking needs a database update (supabase/migrations/008_tracking.sql). Clear both fields to ship without it.",
          );
      } else if (trackingError) dbError(trackingError);
    }
    const { error } = await db.rpc("set_order_status", { p_id: id, p_status: status });
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
