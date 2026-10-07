// True only for a Supabase key that is safe to use for signed-in customers: a publishable key,
// or a legacy key whose role is "anon". A secret or service-role key bypasses row-level
// security, so it must never be accepted here, whatever variable it arrives in.
export function isPublicKey(key: string | undefined) {
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  if (key.startsWith("sb_secret_")) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString());
    return payload.role === "anon";
  } catch {
    return false;
  }
}
// The project URL and public key. Besides this app's own variable names, the names that
// Hostinger's Supabase integration adds (SUPABASE_URL, SUPABASE_API_KEY) are accepted.
export const supabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const supabaseKey = () =>
  [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_API_KEY,
    process.env.SUPABASE_ANON_KEY,
  ].find(isPublicKey) || "";
export function isConfigured() {
  return Boolean(supabaseUrl() && supabaseKey());
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
