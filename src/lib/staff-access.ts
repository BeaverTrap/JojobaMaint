import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizedEmail } from "@/lib/database.types";

export async function fetchAuthorizedEmails(
  supabase: SupabaseClient,
): Promise<AuthorizedEmail[]> {
  const { data, error } = await supabase
    .from("authorized_emails")
    .select("email, note, staff_role, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AuthorizedEmail[];
}

export function normalizeWhitelistEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidWhitelistEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
