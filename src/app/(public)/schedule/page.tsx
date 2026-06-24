import { addMonths, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCalendarEventsForRange } from "@/lib/calendar-events";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import CalendarSyncButton from "@/components/CalendarSyncButton";
import MascotEmptyState from "@/components/MascotEmptyState";
import PageMascotHeading from "@/components/PageMascotHeading";

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
      <PageMascotHeading
        scene="calendar"
        title="Maintenance schedule"
        description="Park maintenance calendar."
      >
        {isAuthorized ? <CalendarSyncButton /> : null}
      </PageMascotHeading>

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
