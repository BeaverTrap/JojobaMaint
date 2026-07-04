import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isWebmasterRole } from "@/lib/staff-roles";

/** Server pages: webmaster-only (redirects if not signed in, authorized, or webmaster). */
export async function requireWebmasterRole(): Promise<void> {
  const { userId, isAuthorized, staffRole, isWebmaster } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    redirect("/login?next=/admin");
  }

  // isWebmaster is derived from the real role (not impersonated)
  if (!isWebmaster && !isWebmasterRole(staffRole)) {
    redirect("/admin");
  }
}
