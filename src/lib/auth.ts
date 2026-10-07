import "server-only";
import { supabase } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { can, homeFor, isStaff, type Area } from "@/lib/permissions";
import { redirect } from "next/navigation";
export async function currentUser() {
  if (!isConfigured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  // Everything on the row, so optional columns added by later migrations are picked up,
  // plus the staff role and its permissions.
  let { data: profile } = await db
    .from("profiles")
    .select("*,staff_roles(id,name,permissions)")
    .eq("id", user.id)
    .single();
  // Before migration 007 there are no staff roles to join; read the plain profile instead.
  if (!profile)
    ({ data: profile } = await db.from("profiles").select("*").eq("id", user.id).single());
  return { ...user, profile };
}
export async function requireUser() {
  if (!isConfigured())
    throw new HttpError(503, "Accounts and ordering will be available after store setup.");
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}
// Full administrators only: staff accounts, roles, and anything not covered by an area.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.profile?.role !== "ADMIN") throw new HttpError(403, "Admin access required.");
  return user;
}
// An admin, or a staff member whose role grants at least one of the listed areas.
// The database applies the same rule again through row-level security.
export async function requirePermission(...areas: Area[]) {
  const user = await requireUser();
  if (!areas.some((area) => can(user.profile, area)))
    throw new HttpError(403, "Your role does not allow this action.");
  return user;
}

// Pages redirect unauthenticated visitors; APIs keep their explicit 401/403 responses.
// Returning false lets the parent layout render the access-denied UI without throwing during
// the independent rendering of child route segments. A staff member who opens an area outside
// their role is sent to the first area they are allowed to use.
// With no area given, the page is for full administrators only.
export async function guardAdminPage(...areas: Area[]) {
  if (!isConfigured()) return false;
  const user = await currentUser();
  if (!user) redirect("/admin");
  if (!isStaff(user.profile)) return false;
  const allowed = areas.length
    ? areas.some((area) => can(user.profile, area))
    : user.profile?.role === "ADMIN";
  if (!allowed) {
    const home = homeFor(user.profile);
    if (!home) return false;
    redirect(home);
  }
  return true;
}
