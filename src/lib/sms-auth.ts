import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/staff-roles";

export type SmsAdminContext =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

export async function requireSmsAdmin(): Promise<SmsAdminContext> {
  const { userId, isAuthorized, staffRole } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!isAdminRole(staffRole)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId };
}
