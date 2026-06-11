import { createClient } from "@/lib/supabase/server";

export async function isAuthorizedStaff(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_authorized")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(profile?.is_authorized);
}
