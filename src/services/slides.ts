import "server-only";
import { isConfigured } from "@/lib/config";
import { supabase } from "@/lib/supabase/server";
import type { PromoSlide } from "@/types";

// Home page carousel slides (migration 004). An empty list until that migration has been run.
export async function getSlides(admin = false): Promise<PromoSlide[]> {
  if (!isConfigured()) return [];
  const db = await supabase();
  let q = db.from("promo_slides").select("*").order("sort_order").order("created_at");
  if (!admin) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw error;
  }
  return data as PromoSlide[];
}
