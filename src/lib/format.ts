import type { StoreSettings } from "@/types";
export const money = (value: number) =>
  `Rs. ${Number(value).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
// Estimate shown before the order is saved; the database applies the same rule from
// store_settings when it creates the order. Null means the settings are not available.
export const deliveryFee = (subtotal: number, settings: StoreSettings | null) =>
  !settings
    ? null
    : subtotal >= settings.free_delivery_from || subtotal === 0
      ? 0
      : settings.delivery_fee;
export const deliveryLabel = (fee: number | null) =>
  fee === null ? "Calculated at checkout" : fee ? money(fee) : "Complimentary";
export const stockLabel = (quantity: number) =>
  quantity === 0 ? "Out of stock" : quantity <= 10 ? `Only ${quantity} left` : "In stock";
export const stockTone = (quantity: number) =>
  quantity === 0 ? "out" : quantity <= 10 ? "low" : "in";
export const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  });
export const dateOnly = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium" });
// Only same-site relative paths are accepted as post-login destinations (no open redirects).
export const safeNext = (next?: string | null, fallback = "/account") =>
  next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
// The store phone setting may hold several numbers ("076 115 5638 / 091 224 5632").
// Each one becomes its own dialable link.
export const phoneNumbers = (value?: string | null) =>
  (value || "")
    .split(/[/,;|]/)
    .map((text) => ({ text: text.trim(), tel: text.replace(/[^+\d]/g, "") }))
    .filter((p) => p.tel.length >= 7);
// A calendar date such as "2026-10-12" shown as "Mon 12 Oct", without time-zone shifting.
export const shortDate = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
