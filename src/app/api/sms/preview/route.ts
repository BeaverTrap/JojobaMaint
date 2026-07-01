import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSmsAdmin } from "@/lib/sms-auth";
import { previewSmsAudience } from "@/lib/sms-dispatch";
import { parseMessageTier } from "@/lib/sms-tiers";

type PreviewBody = {
  message?: string;
  tags?: string[];
  sendToAll?: boolean;
  messageTier?: string;
};

export async function POST(request: Request) {
  const auth = await requireSmsAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const preview = await previewSmsAudience(supabase, {
    bodyTemplate: message,
    tags: Array.isArray(body.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    sendToAll: Boolean(body.sendToAll),
    messageTier: parseMessageTier(body.messageTier),
  });

  return NextResponse.json(preview);
}
