import "server-only";
import { serviceKey } from "@/lib/config";
import { alertRecipients, emailReady, sendEmail } from "@/lib/email";
import { serviceClient, supabase } from "@/lib/supabase/server";
import type { Activity, Customer, Refund, StockMovement } from "@/types";

// Readers for the admin tools added by migration 013. Until it has been run the tables and
// functions do not exist; each reader then returns null and its screen says so.
const missing = (error: { code?: string } | null) =>
  Boolean(
    error &&
    ["PGRST205", "PGRST202", "PGRST200", "PGRST204", "42P01", "42703", "42883"].includes(
      error.code || "",
    ),
  );

export async function getCustomers(): Promise<Customer[] | null> {
  const db = await supabase();
  const { data, error } = await db.rpc("customer_list");
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return (data as Customer[]).map((c) => ({
    ...c,
    order_count: Number(c.order_count),
    total_spent: Number(c.total_spent),
  }));
}
// The most recent stock changes, newest first; for one finish when a variant id is given.
export async function getStockMovements(variantId?: string): Promise<StockMovement[] | null> {
  const db = await supabase();
  let q = db
    .from("stock_movements")
    .select("*,product_variants(sku,color,products(name))")
    .order("id", { ascending: false })
    .limit(300);
  if (variantId) q = q.eq("variant_id", variantId);
  const { data, error } = await q;
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as StockMovement[];
}
export async function getRefunds(orderId: string): Promise<Refund[]> {
  const db = await supabase();
  const { data, error } = await db
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) {
    if (missing(error)) return [];
    throw error;
  }
  return data as Refund[];
}
export async function getActivity(): Promise<Activity[] | null> {
  const db = await supabase();
  const { data, error } = await db
    .from("activity_log")
    .select("*")
    .order("id", { ascending: false })
    .limit(500);
  if (error) {
    if (missing(error)) return null;
    throw error;
  }
  return data as Activity[];
}
// For actions carried out with the server key, which the database's own activity trigger
// cannot attribute to anyone. Never allowed to break the action it describes.
export async function logActivity(action: string, entity: string, id: string, summary: string) {
  try {
    const db = await supabase();
    await db.rpc("add_activity", {
      p_action: action,
      p_entity: entity,
      p_entity_id: id,
      p_summary: summary,
    });
  } catch {
    /* Migration 013 not run yet, or the log is unavailable: the action itself still stands. */
  }
}

const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
// Emails staff about finishes that have just reached their reorder level. The database hands
// each finish out once (claim_low_stock), so an alert is sent one time, and again only after
// the finish has been restocked above its level and fallen back. Call it after anything that
// lowers stock. Does nothing unless email and the server key are set up.
export async function notifyLowStock() {
  if (!emailReady() || !serviceKey()) return;
  try {
    const db = serviceClient();
    const { data, error } = await db.rpc("claim_low_stock");
    if (error || !data?.length) return;
    const rows = data as {
      variant_id: string;
      product_name: string;
      sku: string;
      color: string;
      stock_quantity: number;
      reorder_level: number;
    }[];
    const line = (r: (typeof rows)[number]) =>
      `${r.product_name} (${r.color}, ${r.sku}): ${r.stock_quantity} left, reorder at ${r.reorder_level}`;
    const sent = await sendEmail({
      to: alertRecipients(),
      subject:
        rows.length === 1
          ? `Low stock: ${rows[0].product_name} (${rows[0].stock_quantity} left)`
          : `Low stock: ${rows.length} items need reordering`,
      text: `These items have reached their reorder level:\n\n${rows.map(line).join("\n")}\n`,
      html: `<p>These items have reached their reorder level:</p><table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px"><tr><th align="left">Product</th><th align="left">Finish</th><th align="left">SKU</th><th align="right">In stock</th><th align="right">Reorder at</th></tr>${rows
        .map(
          (r) =>
            `<tr style="border-top:1px solid #ddd"><td>${escape(r.product_name)}</td><td>${escape(r.color)}</td><td>${escape(r.sku)}</td><td align="right"><strong>${r.stock_quantity}</strong></td><td align="right">${r.reorder_level}</td></tr>`,
        )
        .join("")}</table>`,
    });
    // Not delivered: hand the finishes back so the next stock change tries again.
    if (!sent) await db.rpc("release_low_stock", { p_ids: rows.map((r) => r.variant_id) });
  } catch (e) {
    console.error("Low-stock alert failed:", e);
  }
}
