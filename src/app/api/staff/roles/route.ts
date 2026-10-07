import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { staffRoleSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Roles are created and edited by full administrators only; row-level security enforces the same.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const input = staffRoleSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.from("staff_roles").upsert(input).select().single();
    if (error?.code === "23505") throw new HttpError(409, "A role with that name already exists.");
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
    const { error } = await db.from("staff_roles").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
