import { NextResponse } from "next/server";
import {
  ensureCalendarWatchChannel,
  syncGoogleCalendarEvents,
  verifyCalendarWebhookToken,
} from "@/lib/google-calendar";

/**
 * Google Calendar push notifications (events.watch).
 * Google POSTs here when the watched calendar changes.
 */
export async function POST(request: Request) {
  const resourceState = request.headers.get("x-goog-resource-state");
  const channelToken = request.headers.get("x-goog-channel-token");

  if (!verifyCalendarWebhookToken(channelToken)) {
    return NextResponse.json({ error: "Invalid channel token" }, { status: 401 });
  }

  // Initial channel verification — acknowledge without syncing.
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true, action: "channel-verified" });
  }

  if (resourceState !== "exists") {
    return NextResponse.json({ ok: true, action: "ignored", resourceState });
  }

  try {
    const result = await syncGoogleCalendarEvents();
    await ensureCalendarWatchChannel();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[calendar webhook] sync failed:", err);
    const message =
      err instanceof Error ? err.message : "Calendar sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Allow HEAD/GET for manual health checks. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "calendar-webhook" });
}
