import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { apiError, checkOrigin, HttpError, readJson } from "@/lib/http";
import { authSchema, emailSchema, passwordSchema } from "@/lib/validation";
import { appUrl, isConfigured } from "@/lib/config";
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    checkOrigin(request);
    if (!isConfigured())
      throw new HttpError(
        503,
        "Account access will be available once the store is connected to Supabase.",
      );
    const { action } = await params;
    const db = await supabase();
    if (action === "logout") {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === "reset") {
      const { email } = emailSchema.parse(await readJson(request));
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl()}/auth/callback?next=/account/security`,
      });
      // Same answer whether or not the address is registered, so accounts cannot be enumerated.
      if (error) console.error("Password reset request failed", error.message);
      return NextResponse.json({ ok: true });
    }
    if (action === "password") {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new HttpError(401, "Please sign in to continue.");
      const { password } = passwordSchema.parse(await readJson(request));
      const { error } = await db.auth.updateUser({ password });
      if (error) throw new HttpError(400, error.message);
      return NextResponse.json({ ok: true });
    }
    if (!["register", "login"].includes(action)) throw new HttpError(404, "Unknown action.");
    const input = authSchema.parse(await readJson(request));
    if (action === "register") {
      if (!input.name) throw new HttpError(400, "Your name is required.");
      const { data, error } = await db.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { name: input.name },
          emailRedirectTo: `${appUrl()}/auth/callback`,
        },
      });
      if (error) throw new HttpError(400, error.message);
      return NextResponse.json({ ok: true, confirmationRequired: !data.session });
    }
    const { error } = await db.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error)
      throw new HttpError(
        401,
        "Unable to sign in. Check your email, password, and email confirmation.",
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
