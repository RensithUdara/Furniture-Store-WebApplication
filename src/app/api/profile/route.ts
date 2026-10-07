import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { addressSchema, profileSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await readJson(request);
    // Two small forms share this endpoint: personal details, and the saved delivery address.
    const input =
      body && typeof body === "object" && "address_line1" in body
        ? addressSchema.parse(body)
        : profileSchema.parse(body);
    const db = await supabase();
    // Column grants limit customers to these fields; role and email stay protected.
    const { error } = await db.from("profiles").update(input).eq("id", user.id);
    // PGRST204: the address columns do not exist until migration 005 has been run.
    if (error?.code === "PGRST204")
      throw new HttpError(503, "Saved addresses are not switched on yet.");
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
