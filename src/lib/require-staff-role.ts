import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasMinimumStaffRole, type StaffRole } from "@/lib/staff-roles";

export async function requireStaffRole(minimum: StaffRole): Promise<StaffRole> {
  const { userId, isAuthorized, profile } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    redirect("/login?next=/admin");
  }

  const role = profile?.staff_role ?? "staff";
  if (!hasMinimumStaffRole(role, minimum)) {
    redirect("/admin");
  }

  return role;
}
