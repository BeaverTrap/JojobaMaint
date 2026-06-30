import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resident } from "@/lib/database.types";

export const RESIDENT_SELECT =
  "id, name, phone_number, tags, lot_id, created_at, updated_at";

export async function fetchResidentTags(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase.from("residents").select("tags");

  if (error || !data) return [];

  const tagSet = new Set<string>();
  for (const row of data) {
    for (const tag of row.tags ?? []) {
      const trimmed = tag.trim();
      if (trimmed) tagSet.add(trimmed);
    }
  }

  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

/** Residents matching any selected tag, or all when sendToAll is true. */
export async function fetchResidentsForSms(
  supabase: SupabaseClient,
  options: { tags: string[]; sendToAll: boolean },
): Promise<Resident[]> {
  const { data, error } = await supabase
    .from("residents")
    .select(RESIDENT_SELECT);

  if (error || !data) return [];

  const residents = data as Resident[];

  if (options.sendToAll) return residents;

  const selected = new Set(
    options.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );
  if (selected.size === 0) return [];

  return residents.filter((resident) =>
    (resident.tags ?? []).some((tag) =>
      selected.has(tag.trim().toLowerCase()),
    ),
  );
}

/** Normalize to E.164-ish for Twilio (US numbers assumed when 10 digits). */
export function normalizePhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export function uniqueNormalizedPhones(residents: Resident[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const resident of residents) {
    const normalized = normalizePhoneNumber(resident.phone_number);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
