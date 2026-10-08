import "server-only";
import { isConfigured } from "@/lib/config";
import { publicClient } from "@/lib/supabase/server";
import { catalogVersion } from "@/lib/catalog-cache";
import type { StoreSettings } from "@/types";

// Delivery pricing lives in the store_settings table (migration 003). Returns null until that
// migration has been run; the UI then shows "calculated at checkout" instead of guessing a price.
// The settings are public and the same for everyone, so one copy is shared between requests
// for up to 30 seconds and dropped as soon as anything is changed through the app.
const cache = globalThis as unknown as {
  __formaSettings?: { version: number; at: number; data: Promise<StoreSettings | null> };
};
export function getSettings(): Promise<StoreSettings | null> {
  const hit = cache.__formaSettings;
  if (hit && hit.version === catalogVersion() && Date.now() - hit.at < 30_000) return hit.data;
  const entry = { version: catalogVersion(), at: Date.now(), data: load() };
  cache.__formaSettings = entry;
  entry.data.catch(() => {
    if (cache.__formaSettings === entry) cache.__formaSettings = undefined;
  });
  return entry.data;
}
async function load(): Promise<StoreSettings | null> {
  if (!isConfigured()) return null;
  const db = publicClient();
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
        cart_reminder_hours: data.cart_reminder_hours ?? undefined,
      }
    : null;
}
