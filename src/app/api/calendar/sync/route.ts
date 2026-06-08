import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calendarSetupHints,
  getCalendarConfigIssues,
} from "@/lib/calendar-config";
import {
  ensureCalendarWatchChannel,
  syncGoogleCalendarEvents,
} from "@/lib/google-calendar";

/**
 * Manual sync for authorized staff (initial load, testing, watch renewal).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_authorized")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configIssues = getCalendarConfigIssues();
  if (configIssues.length > 0) {
    return NextResponse.json(
      {
        error: "Calendar sync is not configured",
        missing: configIssues,
        hints: calendarSetupHints(configIssues),
      },
      { status: 503 },
    );
  }

  try {
    const result = await syncGoogleCalendarEvents();
    await ensureCalendarWatchChannel();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[calendar sync] failed:", err);
    const message =
      err instanceof Error ? err.message : "Calendar sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
