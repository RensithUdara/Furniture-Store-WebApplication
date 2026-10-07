import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
// Reviews come only from customers who have had the product delivered. The database policy
// enforces that; this route just reports the refusal in plain words.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    await rateLimit("review-user", user.id, 10, 3600);
    const input = reviewSchema.parse(await readJson(request));
    // Shown beside the review: first name and last initial, never the full name or email.
    const parts = String(user.profile?.name || "Customer")
      .trim()
      .split(/\s+/);
    const author = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    const db = await supabase();
    const { error } = await db
      .from("product_reviews")
      .upsert({ ...input, user_id: user.id, author }, { onConflict: "product_id,user_id" });
    if (error?.code === "42501")
      throw new HttpError(403, "Only customers who have received this product can review it.");
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
// Authors remove their own review; staff who manage products can remove any (row-level security).
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireUser();
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.from("product_reviews").delete().eq("id", id).select("id");
    if (error) dbError(error);
    if (!data?.length) throw new HttpError(404, "Review not found.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
