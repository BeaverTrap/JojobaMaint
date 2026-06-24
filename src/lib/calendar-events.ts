import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent } from "@/lib/database.types";

export const CALENDAR_EVENT_SELECT =
  "id, google_event_id, title, description, start_time, end_time, all_day, status, created_at, updated_at";

export async function fetchCalendarEventsForRange(
  supabase: SupabaseClient,
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select(CALENDAR_EVENT_SELECT)
    .neq("status", "cancelled")
    .lt("start_time", rangeEnd)
    .gt("end_time", rangeStart)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}
