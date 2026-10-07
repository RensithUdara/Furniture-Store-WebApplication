import { NextResponse } from "next/server";
import { logActivity } from "@/services/admin";
import { requireAdmin } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { staffAccessSchema, staffCreateSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
export const runtime = "nodejs";

// Staff accounts are created and changed here, by full administrators only. Role and access
// are columns customers can never write, so these changes go through the server-only key
// after the caller has been verified as an admin.

// "ADMIN", or the id of a staff role.
function accessColumns(access: string) {
  return access === "ADMIN"
    ? { role: "ADMIN", staff_role_id: null }
    : { role: "STAFF", staff_role_id: access };
}
async function roleExists(db: ReturnType<typeof serviceClient>, access: string) {
  if (access === "ADMIN") return;
  const { data } = await db.from("staff_roles").select("id").eq("id", access).maybeSingle();
  if (!data) throw new HttpError(400, "Choose a role that exists.");
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const input = staffCreateSchema.parse(await readJson(request));
    const db = serviceClient();
    await roleExists(db, input.access);
    // The account is created already confirmed: the admin vouches for the address.
    const { data, error } = await db.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
    });
    if (error || !data.user)
      throw new HttpError(
        409,
        /already/i.test(error?.message || "")
          ? "An account with this email already exists. Give it access from the list instead."
          : error?.message || "The account could not be created.",
      );
    const { error: profileError } = await db
      .from("profiles")
      .update({ name: input.name, ...accessColumns(input.access) })
      .eq("id", data.user.id);
    if (profileError) {
      // Do not leave behind a login that has no staff access.
      await db.auth.admin.deleteUser(data.user.id);
      dbError(profileError);
    }
    await logActivity("Created", "staff account", data.user.id, `${input.name} (${input.email})`);
    return NextResponse.json({ id: data.user.id }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
// Change someone's access, or remove it (access "NONE" turns them back into a customer).
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const admin = await requireAdmin();
    const { id, access } = staffAccessSchema.parse(await readJson(request));
    const db = serviceClient();
    if (id === admin.id && access !== "ADMIN")
      throw new HttpError(409, "You cannot remove your own admin access.");
    if (access !== "NONE") await roleExists(db, access);
    const { data: target } = await db.from("profiles").select("role").eq("id", id).maybeSingle();
    if (!target) throw new HttpError(404, "Account not found.");
    if (target.role === "ADMIN" && access !== "ADMIN") {
      const { count } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN");
      if ((count || 0) <= 1) throw new HttpError(409, "The store must keep at least one admin.");
    }
    const { error } = await db
      .from("profiles")
      .update(access === "NONE" ? { role: "CUSTOMER", staff_role_id: null } : accessColumns(access))
      .eq("id", id);
    if (error) dbError(error);
    await logActivity(
      "Updated",
      "staff account",
      id,
      access === "NONE"
        ? "Staff access removed"
        : access === "ADMIN"
          ? "Made an admin"
          : "Staff role changed",
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
