import {
  calendarSetupHints,
  getCalendarConfigIssues,
} from "@/lib/calendar-config";
import {
  ensureCalendarWatchChannel,
  syncGoogleCalendarEvents,
} from "@/lib/google-calendar";

export async function runCalendarSync() {
  const configIssues = getCalendarConfigIssues();
  if (configIssues.length > 0) {
    return {
      ok: false as const,
      status: 503 as const,
      body: {
        error: "Calendar sync is not configured",
        missing: configIssues,
        hints: calendarSetupHints(configIssues),
      },
    };
  }

  const result = await syncGoogleCalendarEvents();
  await ensureCalendarWatchChannel();
  return { ok: true as const, status: 200 as const, body: { ok: true, ...result } };
}
