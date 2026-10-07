import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/format";
import { appUrl } from "@/lib/config";
// Where each kind of emailed link lands once its single-use token has been verified.
// A reset or an invitation goes to the page where a password is chosen.
const destinations: Partial<Record<EmailOtpType, string>> = {
  recovery: "/account/security",
  invite: "/account/security",
  email_change: "/account/profile",
};
const linkTypes: EmailOtpType[] = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token_hash");
  const requested = url.searchParams.get("type") as EmailOtpType;
  // Only known link types are accepted; anything else is treated as an email confirmation.
  const type = linkTypes.includes(requested) ? requested : "email";
  const origin = appUrl() || url.origin;
  if (code || token) {
    const db = await supabase();
    const { error } = code
      ? await db.auth.exchangeCodeForSession(code)
      : await db.auth.verifyOtp({ token_hash: token!, type });
    if (!error)
      return NextResponse.redirect(
        new URL(destinations[type] || safeNext(url.searchParams.get("next")), origin),
      );
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", origin));
}
