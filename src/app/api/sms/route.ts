import { NextResponse } from "next/server";
import twilio from "twilio";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  fetchResidentsForSms,
  uniqueNormalizedPhones,
} from "@/lib/residents";
import { isAdminRole } from "@/lib/staff-roles";

const SMS_MAX_LENGTH = 160;

type SmsRequestBody = {
  message?: string;
  tags?: string[];
  sendToAll?: boolean;
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

export async function POST(request: Request) {
  const { userId, isAuthorized, staffRole } = await getCurrentUser();

  if (!userId || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminRole(staffRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SmsRequestBody;
  try {
    body = (await request.json()) as SmsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  const sendToAll = Boolean(body.sendToAll);
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > SMS_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${SMS_MAX_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  if (!sendToAll && tags.length === 0) {
    return NextResponse.json(
      { error: "Select at least one tag or choose Send to All" },
      { status: 400 },
    );
  }

  const twilioResult = twilioConfig();
  if ("error" in twilioResult) {
    return NextResponse.json({ error: twilioResult.error }, { status: 503 });
  }

  const supabase = await createClient();
  const residents = await fetchResidentsForSms(supabase, { tags, sendToAll });
  const phones = uniqueNormalizedPhones(residents);

  if (phones.length === 0) {
    return NextResponse.json(
      { error: "No residents with valid phone numbers match your selection" },
      { status: 400 },
    );
  }

  const { client, from } = twilioResult;
  const failures: { phone: string; error: string }[] = [];
  let sent = 0;

  for (const to of phones) {
    try {
      await client.messages.create({ body: message, from, to });
      sent += 1;
    } catch (err) {
      failures.push({
        phone: to,
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      {
        error: "All messages failed to send",
        failures,
        attempted: phones.length,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent,
    attempted: phones.length,
    failed: failures.length,
    failures: failures.length > 0 ? failures : undefined,
  });
}
