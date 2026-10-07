import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { savedCartSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
// A signed-in customer's bag, kept on the server so it follows them between devices and can
// be remembered in a reminder email. Row-level security limits each customer to their own row.
const absent = (code?: string) => ["PGRST205", "42P01"].includes(code || "");
export async function GET() {
  try {
    const user = await requireUser();
    const db = await supabase();
    const { data, error } = await db
      .from("saved_carts")
      .select("items")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error && !absent(error.code)) dbError(error);
    return NextResponse.json({ items: data?.items || [] });
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { items } = savedCartSchema.parse(await readJson(request));
    const db = await supabase();
    // An empty bag has nothing to remember. A changed bag is due a fresh reminder.
    const { error } = items.length
      ? await db.from("saved_carts").upsert({
          user_id: user.id,
          items,
          updated_at: new Date().toISOString(),
          reminded_at: null,
        })
      : await db.from("saved_carts").delete().eq("user_id", user.id);
    if (error && !absent(error.code)) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
