import "server-only";
import { appUrl, isConfigured, serviceKey } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { money } from "@/lib/format";
import { serviceClient, supabase } from "@/lib/supabase/server";
import type { FlashSale, Subscriber } from "@/types";

// Readers for migration 014. Until it has been run the tables do not exist; each reader then
// returns nothing (or null where the screen needs to tell the two apart).
const missing = (error: { code?: string } | null) =>
  Boolean(
    error &&
    ["PGRST205", "PGRST202", "PGRST200", "42P01", "42703", "42883"].includes(error.code || ""),
  );

// Flash sales. Shoppers are given only the ones running now (row-level security); staff who
// manage promotions get all of them, including finished and upcoming ones.
export async function getFlashSales(): Promise<FlashSale[] | null> {
  if (!isConfigured()) return null;
  const db = await supabase();
  const { data, error } = await db
    .from("flash_sales")
    .select("*,flash_sale_items(product_id)")
    .order("ends_at", { ascending: false });
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data.map(({ flash_sale_items, ...s }) => ({
    ...s,
    discount_percent: Number(s.discount_percent),
    product_ids: (flash_sale_items as { product_id: string }[]).map((i) => i.product_id),
  })) as FlashSale[];
}
export async function getSubscribers(): Promise<Subscriber[] | null> {
  const db = await supabase();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("id,email,created_at,unsubscribed_at")
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as Subscriber[];
}

const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
type SavedItem = {
  name?: string;
  details?: string;
  quantity?: number;
  price?: number;
  image?: string;
};
// Emails customers whose saved bag has sat untouched for the time set in Admin > Settings.
// The database hands each bag out once (claim_cart_reminders), so nobody is reminded twice
// about the same bag. Needs the server key, RESEND_API_KEY, EMAIL_FROM and APP_URL; without
// them it does nothing. Runs at most once every ten minutes per server.
let lastRun = 0;
export async function sendCartReminders(force = false) {
  if (!serviceKey() || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !appUrl())
    return 0;
  if (!force && Date.now() - lastRun < 600_000) return 0;
  lastRun = Date.now();
  try {
    const db = serviceClient();
    const { data, error } = await db.rpc("claim_cart_reminders");
    if (error || !data?.length) return 0;
    const failed: string[] = [];
    let sent = 0;
    for (const row of data as {
      user_id: string;
      name: string;
      email: string;
      items: SavedItem[];
      token: string;
    }[]) {
      const items = (Array.isArray(row.items) ? row.items : []).filter((i) => i?.name);
      const first = String(row.name || "").split(" ")[0];
      const stop = `${appUrl()}/unsubscribe?cart=${row.token}`;
      const ok = await sendEmail({
        to: [row.email],
        subject:
          items.length === 1
            ? `Still thinking about the ${items[0].name}?`
            : "Your bag at Forma & Co. is waiting",
        text: `Hello${first ? ` ${first}` : ""},\n\nYou left these in your bag at Forma & Co.:\n\n${items
          .map(
            (i) =>
              `- ${i.name} (${i.details || ""}) x ${i.quantity || 1}, ${money(Number(i.price || 0))} each`,
          )
          .join(
            "\n",
          )}\n\nPick up where you left off: ${appUrl()}/cart\n\nPrices and stock are confirmed at checkout.\n\nNo more reminders: ${stop}\n`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1c2333;max-width:560px"><p>Hello${first ? ` ${escape(first)}` : ""},</p><p>You left these in your bag at Forma &amp; Co.:</p><table cellpadding="8" style="border-collapse:collapse;width:100%">${items
          .map(
            (i) =>
              `<tr style="border-top:1px solid #e5e7eb"><td><strong>${escape(String(i.name))}</strong><br><span style="color:#6b7280">${escape(String(i.details || ""))}</span></td><td align="right" style="white-space:nowrap">${Number(i.quantity || 1)} × ${escape(money(Number(i.price || 0)))}</td></tr>`,
          )
          .join(
            "",
          )}</table><p style="margin:24px 0"><a href="${appUrl()}/cart" style="background:#16213e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Return to your bag</a></p><p style="color:#6b7280;font-size:13px">Prices and stock are confirmed at checkout.<br><a href="${stop}" style="color:#6b7280">Stop these reminders</a></p></div>`,
      });
      if (ok) sent++;
      else failed.push(row.user_id);
    }
    // Not delivered: hand those bags back so the next run tries again.
    if (failed.length) await db.rpc("release_cart_reminders", { p_users: failed });
    return sent;
  } catch (e) {
    console.error("Cart reminders failed:", e);
    return 0;
  }
}
