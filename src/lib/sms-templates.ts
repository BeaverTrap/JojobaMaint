import type { SupabaseClient } from "@supabase/supabase-js";
import type { SmsHistory, SmsTemplate } from "@/lib/database.types";

export const SMS_TEMPLATE_SELECT =
  "id, title, body, message_tier, sort_order, created_at, updated_at";

export async function fetchSmsTemplates(
  supabase: SupabaseClient,
): Promise<SmsTemplate[]> {
  const { data, error } = await supabase
    .from("sms_templates")
    .select(SMS_TEMPLATE_SELECT)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as SmsTemplate[];
}
