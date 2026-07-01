/** @deprecated Import from @/lib/sms-dispatch instead. Re-exports for compatibility. */
export {
  RESIDENT_SELECT,
  fetchResidentTags,
  fetchResidentsForSms,
  normalizePhoneNumber,
  type SmsAudienceParams,
} from "@/lib/sms-dispatch";

import type { Resident } from "@/lib/database.types";
import { fetchResidentsForSms, normalizePhoneNumber } from "@/lib/sms-dispatch";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function fetchResidentsForSmsLegacy(
  supabase: SupabaseClient,
  options: { tags: string[]; sendToAll: boolean },
): Promise<Resident[]> {
  return fetchResidentsForSms(supabase, {
    ...options,
    messageTier: "critical",
  });
}
