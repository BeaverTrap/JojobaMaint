import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { processDueScheduledMessages } from "@/lib/sms-scheduling";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueScheduledMessages();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sms cron] failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Scheduled SMS dispatch failed",
      },
      { status: 500 },
    );
  }
}
