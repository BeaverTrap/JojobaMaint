import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

export type CurrentUser = {
  userId: string | null;
  profile: Profile | null;
  isAuthorized: boolean;
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
    return { userId: null, profile: null, isAuthorized: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const typed = (profile as Profile) ?? null;
  return {
    userId: user.id,
    profile: typed,
    isAuthorized: Boolean(typed?.is_authorized),
  };
}
