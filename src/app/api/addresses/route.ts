import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { addressBookSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// The customer's own address book. Row-level security limits every query to their rows, and a
// database trigger keeps exactly one default and caps the book at ten.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const input = addressBookSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db
      .from("addresses")
      .upsert({ ...input, user_id: user.id })
      .select("id");
    if (error) dbError(error);
    if (!data?.length) throw new HttpError(404, "Address not found.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireUser();
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("addresses").delete().eq("id", id);
    if (error) dbError(error);
    // If the default was removed, the oldest remaining address takes its place.
    const { data: rest } = await db.from("addresses").select("id,is_default").order("created_at");
    if (rest?.length && !rest.some((a) => a.is_default))
      await db.from("addresses").update({ is_default: true }).eq("id", rest[0].id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
