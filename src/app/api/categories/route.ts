import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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
    await requireAdmin();
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
