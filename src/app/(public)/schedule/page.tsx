import { addMonths, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCalendarEventsForRange } from "@/lib/calendar-events";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import CalendarSyncButton from "@/components/CalendarSyncButton";
import MascotEmptyState from "@/components/MascotEmptyState";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const rangeStart = subMonths(new Date(), 3).toISOString();
  const rangeEnd = addMonths(new Date(), 12).toISOString();
  const events = await fetchCalendarEventsForRange(
    supabase,
    rangeStart,
    rangeEnd,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Maintenance schedule
          </h1>
          <p className="text-sm text-muted">
            Park maintenance calendar.
          </p>
        </div>
        {isAuthorized && <CalendarSyncButton />}
      </div>

      <ScheduleCalendar events={events} />

      {events.length === 0 && (
        <MascotEmptyState
          scene="calendar"
          title="No events in the cache yet"
          description={
            isAuthorized
              ? "Tap Sync calendar to load events from Google Calendar."
              : "Events appear here when the schedule is updated."
          }
        />
      )}
    </div>
  );
}
