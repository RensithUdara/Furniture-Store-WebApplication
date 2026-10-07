import "server-only";
import { supabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { StaffMember, StaffRole } from "@/types";

// Staff accounts and roles are managed by full administrators only.
// Both readers return null until migration 007 has been run.
export async function getStaffRoles(): Promise<StaffRole[] | null> {
  await requireAdmin();
  const db = await supabase();
  const { data, error } = await db.from("staff_roles").select("*").order("name");
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw error;
  }
  return data as StaffRole[];
}
export async function getStaff(): Promise<StaffMember[] | null> {
  await requireAdmin();
  const db = await supabase();
  const { data, error } = await db
    .from("profiles")
    .select("id,name,email,role,staff_role_id,created_at")
    .in("role", ["ADMIN", "STAFF"])
    .order("role")
    .order("name");
  if (error) {
    // 42703: the staff_role_id column does not exist yet.
    if (error.code === "42703") return null;
    throw error;
  }
  return data as StaffMember[];
}
