import { getCurrentUser } from "@/lib/auth";
import {
  assignableStaffRoles,
  canManageStaffAccess,
  type StaffRole,
} from "@/lib/staff-roles";

export type StaffAccessActor =
  | { ok: true; userId: string; staffRole: StaffRole }
  | { ok: false; status: 401 | 403; error: string };

export async function requireStaffAccessActor(): Promise<StaffAccessActor> {
  const { userId, isAuthorized, staffRole, isWebmaster } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!isWebmaster && (!staffRole || !canManageStaffAccess(staffRole))) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId, staffRole: staffRole ?? "webmaster" };
}

export function canActorAssignRole(
  actorRole: StaffRole,
  targetRole: StaffRole,
): boolean {
  return assignableStaffRoles(actorRole).includes(targetRole);
}
