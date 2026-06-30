import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/staff-roles";

/** Server pages: admin-only (redirects if not signed in, authorized, or admin). */
export async function requireAdminRole(): Promise<void> {
  const { userId, isAuthorized, staffRole } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    redirect("/login?next=/admin");
  }

  if (!isAdminRole(staffRole)) {
    redirect("/admin");
  }
}
