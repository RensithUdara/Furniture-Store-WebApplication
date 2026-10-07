import { NextResponse } from "next/server";
import { requirePermission, requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { returnDecisionSchema, returnRequestSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
// Both steps run inside database functions, which check ownership, the delivered status, the
// return period, and the allowed order of decisions.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireUser();
    const input = returnRequestSchema.parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.rpc("request_return", {
      p_order: input.order_id,
      p_reason: input.reason,
      p_details: input.details,
    });
    if (error) dbError(error);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("orders");
    const input = returnDecisionSchema.parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.rpc("resolve_return", {
      p_id: input.id,
      p_status: input.status,
      p_note: input.note,
    });
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
