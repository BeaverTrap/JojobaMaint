import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSmsAdmin } from "@/lib/sms-auth";
import { smsCharLimit } from "@/lib/sms-composer";
import {
  dispatchSmsAlert,
  previewSmsAudience,
} from "@/lib/sms-dispatch";
import { parseMessageTier } from "@/lib/sms-tiers";

type SmsRequestBody = {
  message?: string;
  tags?: string[];
  sendToAll?: boolean;
  messageTier?: string;
};

function parseAudience(body: SmsRequestBody) {
  return {
    message: body.message?.trim() ?? "",
    tags: Array.isArray(body.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    sendToAll: Boolean(body.sendToAll),
    messageTier: parseMessageTier(body.messageTier),
  };
}

export async function POST(request: Request) {
  const auth = await requireSmsAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: SmsRequestBody;
  try {
    body = (await request.json()) as SmsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const audience = parseAudience(body);
  const limit = smsCharLimit(audience.message);

  if (!audience.message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (audience.message.length > limit) {
    return NextResponse.json(
      { error: `Message must be ${limit} characters or fewer` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const result = await dispatchSmsAlert(supabase, {
    bodyTemplate: audience.message,
    tags: audience.tags,
    sendToAll: audience.sendToAll,
    messageTier: audience.messageTier,
    sentBy: auth.userId,
  });

  if ("error" in result && result.error) {
    const status = "status" in result && result.status ? result.status : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  const auth = await requireSmsAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const message = url.searchParams.get("message")?.trim() ?? "";
  const sendToAll = url.searchParams.get("sendToAll") === "true";
  const messageTier = parseMessageTier(url.searchParams.get("messageTier"));
  const tags = url.searchParams.getAll("tag");

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const preview = await previewSmsAudience(supabase, {
    bodyTemplate: message,
    tags,
    sendToAll,
    messageTier,
  });

  return NextResponse.json(preview);
}
