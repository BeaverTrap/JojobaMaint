import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";
import type { StaffRole } from "@/lib/staff-roles";
import { getDebugRole } from "@/lib/debug-mode";

export type CurrentUser = {
  userId: string | null;
  profile: Profile | null;
  isAuthorized: boolean;
  staffRole: StaffRole | null;
  /** The role the webmaster is viewing-as (null = viewing as themselves). */
  debugRole: StaffRole | null;
  /** The effective role after debug override. Use this for UI gating. */
  effectiveRole: StaffRole | null;
  /** True if the real user is a webmaster (regardless of debug impersonation). */
  isWebmaster: boolean;
};

/**
 * Server-side helper: returns the signed-in user's profile (if any) plus a
 * convenience `isAuthorized` flag. Safe to call on public pages — returns
 * nulls for anonymous visitors.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null, isAuthorized: false, staffRole: null, debugRole: null, effectiveRole: null, isWebmaster: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const typed = (profile as Profile) ?? null;
  const realRole = typed?.staff_role ?? null;
  const isWebmaster = realRole === "webmaster";

  let debugRole: StaffRole | null = null;
  if (isWebmaster) {
    debugRole = await getDebugRole();
  }

  const effectiveRole = debugRole ?? realRole;

  return {
    userId: user.id,
    profile: typed,
    isAuthorized: Boolean(typed?.is_authorized),
    staffRole: realRole,
    debugRole,
    effectiveRole,
    isWebmaster,
  };
}
