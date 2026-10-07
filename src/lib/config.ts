export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
// Single place that reads deployment settings. Read lazily so values are never baked into a
// build; none of the secrets below use the NEXT_PUBLIC_ prefix, so they never reach the browser.
export const appUrl = () =>
  (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
export const serviceKey = () =>
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const whatsappNumber = () =>
  (process.env.WHATSAPP_BUSINESS_NUMBER || process.env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
export const PAYHERE_URLS = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const;
export function payhere() {
  const merchant = process.env.PAYHERE_MERCHANT_ID || "";
  const secret = process.env.PAYHERE_MERCHANT_SECRET || "";
  // Anything other than an explicit "live" stays on the sandbox, so a typo cannot take real money.
  const mode = process.env.PAYHERE_MODE === "live" ? "live" : "sandbox";
  return {
    merchant,
    secret,
    mode,
    action: PAYHERE_URLS[mode],
    ready: Boolean(merchant && secret && serviceKey() && appUrl()),
  } as const;
}
