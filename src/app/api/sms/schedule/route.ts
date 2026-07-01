import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSmsAdmin } from "@/lib/sms-auth";
import { smsCharLimit } from "@/lib/sms-composer";
import { scheduleSmsMessage } from "@/lib/sms-scheduling";
import { parseMessageTier } from "@/lib/sms-tiers";

type ScheduleBody = {
  message?: string;
  tags?: string[];
  sendToAll?: boolean;
  messageTier?: string;
  scheduledAt?: string;
  syncToCalendar?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireSmsAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ScheduleBody;
  try {
    body = (await request.json()) as ScheduleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const sendToAll = Boolean(body.sendToAll);
  const messageTier = parseMessageTier(body.messageTier);
  const scheduledAt = body.scheduledAt?.trim() ?? "";
  const syncToCalendar = Boolean(body.syncToCalendar);

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const limit = smsCharLimit(message);
  if (message.length > limit) {
    return NextResponse.json(
      { error: `Message must be ${limit} characters or fewer` },
      { status: 400 },
    );
  }

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "Schedule date and time are required" },
      { status: 400 },
    );
  }

  if (!sendToAll && tags.length === 0) {
    return NextResponse.json(
      { error: "Select at least one tag or choose Send to All" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const result = await scheduleSmsMessage(supabase, {
    bodyTemplate: message,
    tags,
    sendToAll,
    messageTier,
    scheduledAt,
    syncToCalendar,
    createdBy: auth.userId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
