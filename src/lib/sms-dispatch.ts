import type { SupabaseClient } from "@supabase/supabase-js";
import twilio from "twilio";
import type { Resident } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyTemplateVariables,
  escapeXml,
  smsCharLimit,
} from "@/lib/sms-composer";
import {
  residentReceivesMessageTier,
  type SmsMessageTier,
} from "@/lib/sms-tiers";

export const RESIDENT_SELECT =
  "id, name, phone_number, tags, lot_id, alert_tier, created_at, updated_at";

export type SmsAudienceParams = {
  tags: string[];
  sendToAll: boolean;
  messageTier: SmsMessageTier;
};

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

/** Residents matching tags (or all), filtered by message tier vs resident alert_tier. */
export async function fetchResidentsForSms(
  supabase: SupabaseClient,
  options: SmsAudienceParams,
): Promise<Resident[]> {
  const { data, error } = await supabase
    .from("residents")
    .select(RESIDENT_SELECT);

  if (error || !data) return [];

  let residents = data as Resident[];

  if (!options.sendToAll) {
    const selected = new Set(
      options.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    );
    if (selected.size === 0) return [];
    residents = residents.filter((resident) =>
      (resident.tags ?? []).some((tag) =>
        selected.has(tag.trim().toLowerCase()),
      ),
    );
  }

  return residents.filter((resident) =>
    residentReceivesMessageTier(resident.alert_tier, options.messageTier),
  );
}

export function normalizePhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export function isLandlineTwilioError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? Number(err.code) : NaN;
  if (code === 21614 || code === 30006 || code === 21211) return true;
  const message =
    "message" in err && typeof err.message === "string"
      ? err.message.toLowerCase()
      : "";
  return message.includes("landline") || message.includes("not a valid mobile");
}

export type DispatchFailure = {
  phone: string;
  name: string;
  error: string;
  voiceFallback?: boolean;
};

export type DispatchResult = {
  recipientCount: number;
  successCount: number;
  failedCount: number;
  voiceFallbackCount: number;
  failures: DispatchFailure[];
};

export type DispatchParams = SmsAudienceParams & {
  bodyTemplate: string;
  sentBy: string | null;
  scheduledMessageId?: string;
};

function twilioConfig():
  | { client: ReturnType<typeof twilio>; from: string }
  | { error: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return {
      error:
        "Twilio is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).",
    };
  }

  return { client: twilio(accountSid, authToken), from };
}

async function logSmsHistory(
  params: DispatchParams,
  result: DispatchResult,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("sms_history").insert({
    sent_by: params.sentBy,
    body_template: params.bodyTemplate,
    tags: params.tags,
    send_to_all: params.sendToAll,
    message_tier: params.messageTier,
    recipient_count: result.recipientCount,
    success_count: result.successCount,
    failed_count: result.failedCount,
    voice_fallback_count: result.voiceFallbackCount,
    scheduled_message_id: params.scheduledMessageId ?? null,
    failures: result.failures.length > 0 ? result.failures : null,
  });
}

export async function dispatchSmsAlert(
  supabase: SupabaseClient,
  params: DispatchParams,
): Promise<DispatchResult | { error: string; status?: number }> {
  const bodyTemplate = params.bodyTemplate.trim();
  if (!bodyTemplate) {
    return { error: "Message is required", status: 400 };
  }

  const limit = smsCharLimit(bodyTemplate);
  if (bodyTemplate.length > limit) {
    return {
      error: `Message must be ${limit} characters or fewer`,
      status: 400,
    };
  }

  if (!params.sendToAll && params.tags.length === 0) {
    return {
      error: "Select at least one tag or choose Send to All",
      status: 400,
    };
  }

  const twilioResult = twilioConfig();
  if ("error" in twilioResult) {
    return { error: twilioResult.error, status: 503 };
  }

  const residents = await fetchResidentsForSms(supabase, params);
  const deliveries: { resident: Resident; phone: string; body: string }[] = [];
  const seenPhones = new Set<string>();

  for (const resident of residents) {
    const phone = normalizePhoneNumber(resident.phone_number);
    if (!phone || seenPhones.has(phone)) continue;
    seenPhones.add(phone);
    const body = applyTemplateVariables(bodyTemplate, resident);
    if (body.length > smsCharLimit(body)) continue;
    deliveries.push({ resident, phone, body });
  }

  if (deliveries.length === 0) {
    return {
      error: "No residents with valid phone numbers match your selection",
      status: 400,
    };
  }

  const { client, from } = twilioResult;
  const failures: DispatchFailure[] = [];
  let successCount = 0;
  let voiceFallbackCount = 0;

  for (const delivery of deliveries) {
    try {
      await client.messages.create({
        body: delivery.body,
        from,
        to: delivery.phone,
      });
      successCount += 1;
    } catch (err) {
      if (isLandlineTwilioError(err)) {
        try {
          await client.calls.create({
            twiml: `<Response><Say voice="alice">${escapeXml(delivery.body)}</Say></Response>`,
            from,
            to: delivery.phone,
          });
          successCount += 1;
          voiceFallbackCount += 1;
          continue;
        } catch (voiceErr) {
          failures.push({
            phone: delivery.phone,
            name: delivery.resident.name,
            error:
              voiceErr instanceof Error
                ? voiceErr.message
                : "Voice fallback failed",
            voiceFallback: true,
          });
          continue;
        }
      }

      failures.push({
        phone: delivery.phone,
        name: delivery.resident.name,
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
  }

  const result: DispatchResult = {
    recipientCount: deliveries.length,
    successCount,
    failedCount: failures.length,
    voiceFallbackCount,
    failures,
  };

  await logSmsHistory(params, result);

  if (successCount === 0) {
    return {
      error: "All messages failed to send",
      status: 502,
      recipientCount: deliveries.length,
      successCount: 0,
      failedCount: failures.length,
      voiceFallbackCount,
      failures,
    };
  }

  return result;
}

/** Count matching recipients without sending; reports how many were skipped by tier. */
export async function previewSmsAudience(
  supabase: SupabaseClient,
  params: SmsAudienceParams & { bodyTemplate: string },
): Promise<{ recipientCount: number; skippedByTier: number }> {
  const residents = await fetchResidentsForSms(supabase, params);
  const seenPhones = new Set<string>();
  let recipientCount = 0;

  for (const resident of residents) {
    const phone = normalizePhoneNumber(resident.phone_number);
    if (!phone || seenPhones.has(phone)) continue;
    const body = applyTemplateVariables(params.bodyTemplate.trim(), resident);
    if (body.length > smsCharLimit(body)) continue;
    seenPhones.add(phone);
    recipientCount += 1;
  }

  const { data: allResidents } = await supabase
    .from("residents")
    .select("id, tags, alert_tier");

  let skippedByTier = 0;
  if (allResidents) {
    for (const row of allResidents) {
      if (
        residentReceivesMessageTier(
          row.alert_tier as Resident["alert_tier"],
          params.messageTier,
        )
      ) {
        continue;
      }
      const matchesTag =
        params.sendToAll ||
        (row.tags ?? []).some((tag: string) =>
          params.tags.some(
            (selected) =>
              selected.trim().toLowerCase() === tag.trim().toLowerCase(),
          ),
        );
      if (matchesTag) skippedByTier += 1;
    }
  }

  return { recipientCount, skippedByTier };
}
