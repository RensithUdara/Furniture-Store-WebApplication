import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { statusSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
import { z } from "zod";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    await requireUser();
    const id = z.uuid().parse((await params).id);
    const { status } = statusSchema.parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.rpc("set_order_status", { p_id: id, p_status: status });
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
