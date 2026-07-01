import type { SupabaseClient } from "@supabase/supabase-js";
import type { SmsHistory } from "@/lib/database.types";

export const SMS_HISTORY_SELECT =
  "id, sent_by, body_template, tags, send_to_all, message_tier, recipient_count, success_count, failed_count, voice_fallback_count, scheduled_message_id, failures, created_at, profiles(display_name)";

export type SmsHistoryRow = SmsHistory & {
  profiles: { display_name: string | null } | null;
};

export async function fetchSmsHistory(
  supabase: SupabaseClient,
  limit = 50,
): Promise<SmsHistoryRow[]> {
  const { data, error } = await supabase
    .from("sms_history")
    .select(SMS_HISTORY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    return {
      ...(row as SmsHistory),
      profiles: profile ?? null,
    };
  });
}
