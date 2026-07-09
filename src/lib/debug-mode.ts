import { cookies } from "next/headers";
import type { StaffRole } from "@/lib/staff-roles";
import { STAFF_ROLES } from "@/lib/staff-roles";

export const DEBUG_ROLE_COOKIE = "jw_debug_role";
export const DEBUG_PUBLIC_VALUE = "public";

export type DebugRoleValue = StaffRole | "public" | null;

/**
 * Returns the impersonated role from the debug cookie, or null if not set.
 * "public" means viewing as a logged-out visitor.
 * Only webmasters can impersonate — callers must verify the real role first.
 */
export async function getDebugRole(): Promise<DebugRoleValue> {
  const jar = await cookies();
  const val = jar.get(DEBUG_ROLE_COOKIE)?.value;
  if (!val) return null;
  if (val === DEBUG_PUBLIC_VALUE) return "public";
  if (STAFF_ROLES.includes(val as StaffRole)) return val as StaffRole;
  return null;
}
