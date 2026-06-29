import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import type { CalendarEvent } from "@/lib/database.types";
import {
  isWastePickupDay,
  pickupScheduleLabel,
  wastePickupDayNote,
  type PickupScheduleMode,
} from "@/lib/pickup-schedule";

function formatEventWhen(event: CalendarEvent): string {
  const start = new Date(event.start_time);
  if (event.all_day) {
    if (isToday(start)) return "Today · all day";
    if (isTomorrow(start)) return "Tomorrow · all day";
    return format(start, "EEE, MMM d · all day");
  }
  const time = format(start, "h:mm a");
  if (isToday(start)) return `Today · ${time}`;
  if (isTomorrow(start)) return `Tomorrow · ${time}`;
  return format(start, "EEE, MMM d · h:mm a");
}

export default function HomeTodayWidgets({
  pickupMode,
  events,
}: {
  pickupMode: PickupScheduleMode;
  events: CalendarEvent[];
}) {
  const today = new Date();
  const pickupToday = isWastePickupDay(today, pickupMode);
  const pickupNote = wastePickupDayNote(today, pickupMode);
  const upcomingEvents = events.slice(0, 3);

  return (
    <section aria-labelledby="home-today-heading" className="space-y-3">
      <h2
        id="home-today-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted"
      >
        Today at Jojoba
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Waste pickup</h3>
            <Link
              href="/pickup-guidelines"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Guidelines →
            </Link>
          </div>
          <p className="mt-3 text-sm font-medium text-ink">
            {pickupToday ? "Pickup today" : "No pickup today"}
          </p>
          <p className="mt-1 text-sm text-muted">{pickupScheduleLabel(pickupMode)}</p>
          {pickupNote ? (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
              {pickupNote}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Coming up</h3>
            <Link
              href="/schedule"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Schedule →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No upcoming events this week.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="text-sm">
                  <p className="font-medium text-ink">{event.title}</p>
                  <p className="text-xs text-muted">{formatEventWhen(event)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
