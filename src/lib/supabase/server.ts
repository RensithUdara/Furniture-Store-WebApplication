import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isConfigured, serviceKey, supabaseKey, supabaseUrl } from "@/lib/config";

export async function supabase() {
  if (!isConfigured()) throw new Error("Connect Supabase to enable accounts and orders.");
  const jar = await cookies();
  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* Server Components rely on proxy for cookie refresh. */
        }
      },
    },
  });
}
// Bypasses row-level security. Used only by server code that has already verified the caller:
// the signature-checked PayHere notification, and staff management after an admin check.
export function serviceClient() {
  if (!serviceKey() || !isConfigured()) throw new Error("The server key is not configured.");
  return createClient(supabaseUrl(), serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
