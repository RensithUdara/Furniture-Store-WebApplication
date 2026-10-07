import { z } from "zod";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getCategories } from "@/services/catalog";
import { supabase } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
export async function GET() {
  try {
    return NextResponse.json(await getCategories());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("categories");
    const input = categorySchema.parse(await readJson(request));
    const db = await supabase();
    if (input.parent_id) {
      // Two levels only: a parent must itself be a top-level category, and never the category itself.
      const { data: parent } = await db
        .from("categories")
        .select("id,parent_id")
        .eq("id", input.parent_id)
        .maybeSingle();
      if (!parent || parent.parent_id || parent.id === input.id)
        throw new HttpError(400, "Choose a top-level category as the parent.");
    }
    const { data, error } = await db.from("categories").upsert(input).select().single();
    if (error) dbError(error);
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}
// Deleting is only possible for a category nothing depends on. One with products or
// sub-categories is protected by the database's foreign keys, and should be hidden instead.
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("categories");
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error?.code === "23503")
      throw new HttpError(
        409,
        "This category still has products or sub-categories. Move them first, or hide the category instead.",
      );
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
