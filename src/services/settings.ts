import "server-only";
import { isConfigured } from "@/lib/config";
import { supabase } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types";

// Delivery pricing lives in the store_settings table (migration 003). Returns null until that
// migration has been run; the UI then shows "calculated at checkout" instead of guessing a price.
export async function getSettings(): Promise<StoreSettings | null> {
  if (!isConfigured()) return null;
  const db = await supabase();
  const { data, error } = await db.from("store_settings").select("*").maybeSingle();
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw error;
  }
  return data
    ? {
        delivery_fee: Number(data.delivery_fee),
        free_delivery_from: Number(data.free_delivery_from),
        store_phone: data.store_phone,
        pickup_address: data.pickup_address,
        pickup_open_hour: data.pickup_open_hour,
        pickup_close_hour: data.pickup_close_hour,
        points_per_100: data.points_per_100,
        point_value: data.point_value == null ? undefined : Number(data.point_value),
        unpaid_expiry_minutes: data.unpaid_expiry_minutes ?? undefined,
        return_window_days: data.return_window_days ?? undefined,
      }
    : null;
}
