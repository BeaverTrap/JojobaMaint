import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchSmsAlert, type SmsAudienceParams } from "@/lib/sms-dispatch";
import type { SmsMessageTier } from "@/lib/sms-tiers";

export type ScheduleParams = SmsAudienceParams & {
  bodyTemplate: string;
  scheduledAt: string;
  createdBy: string;
};

export async function scheduleSmsMessage(
  supabase: SupabaseClient,
  params: ScheduleParams,
): Promise<{ id: string } | { error: string }> {
  const scheduledAt = new Date(params.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Invalid schedule time" };
  }
  if (scheduledAt.getTime() <= Date.now()) {
    return { error: "Schedule time must be in the future" };
  }

  const { data, error } = await supabase
    .from("scheduled_messages")
    .insert({
      created_by: params.createdBy,
      body: params.bodyTemplate.trim(),
      tags: params.tags,
      send_to_all: params.sendToAll,
      message_tier: params.messageTier,
      scheduled_at: scheduledAt.toISOString(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save scheduled message" };
  }

  return { id: data.id };
}

export async function processDueScheduledMessages(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("scheduled_messages")
    .select("id, body, tags, send_to_all, message_tier, created_by")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error || !due?.length) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of due) {
    const result = await dispatchSmsAlert(supabase, {
      bodyTemplate: row.body,
      tags: row.tags ?? [],
      sendToAll: row.send_to_all,
      messageTier: row.message_tier as SmsMessageTier,
      sentBy: row.created_by,
      scheduledMessageId: row.id,
    });

    if ("error" in result && result.error) {
      failed += 1;
      await supabase
        .from("scheduled_messages")
        .update({
          status: "failed",
          error_message: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    } else if ("successCount" in result) {
      sent += result.successCount;
      await supabase
        .from("scheduled_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  }

  return { processed: due.length, sent, failed };
}
