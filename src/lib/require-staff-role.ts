import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasMinimumStaffRole, type StaffRole } from "@/lib/staff-roles";

/**
 * Gate an admin page by minimum role. Returns the effective role (may be
 * overridden by webmaster debug impersonation). Webmasters always pass the
 * gate regardless of impersonation — the override only affects UI rendering.
 */
export async function requireStaffRole(minimum: StaffRole): Promise<StaffRole> {
  const { userId, isAuthorized, staffRole, effectiveRole, isWebmaster } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    redirect("/login?next=/admin");
  }

  const realRole = staffRole ?? "staff";

  // Webmasters always have access (they're impersonating for UI preview only)
  if (!isWebmaster && !hasMinimumStaffRole(realRole, minimum)) {
    redirect("/admin");
  }

  // Return the effective (possibly impersonated) role for UI gating
  return effectiveRole ?? realRole;
}
