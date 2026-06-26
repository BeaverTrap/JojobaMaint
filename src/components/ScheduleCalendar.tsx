"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { CalendarEvent } from "@/lib/database.types";
import {
  GREEN_WASTE_PICKUP_LABEL,
  isGreenWastePickupCalendarEvent,
  isWastePickupDay,
  wastePickupDayNote,
  type PickupScheduleMode,
} from "@/lib/pickup-schedule";
import AnimateIn from "@/components/AnimateIn";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end > dayStart;
}

function visibleDayEvents(
  dayEvents: CalendarEvent[],
  day: Date,
  mode: PickupScheduleMode,
): CalendarEvent[] {
  if (!isWastePickupDay(day, mode)) {
    return dayEvents;
  }
  return dayEvents.filter((event) => !isGreenWastePickupCalendarEvent(event));
}

function formatEventTime(event: CalendarEvent): string {
  if (event.all_day) return "All day";
  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

function GreenWastePickupDetail({
  day,
  mode,
}: {
  day: Date;
  mode: PickupScheduleMode;
}) {
  const note = wastePickupDayNote(day, mode);
  return (
    <li className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="font-semibold text-emerald-950 dark:text-emerald-100">
        {GREEN_WASTE_PICKUP_LABEL}
      </p>
      {note ? (
        <p className="mt-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          {note}
        </p>
      ) : null}
    </li>
  );
}

export default function ScheduleCalendar({
  events,
  pickupScheduleMode,
}: {
  events: CalendarEvent[];
  pickupScheduleMode: PickupScheduleMode;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of calendarDays) {
      const key = format(day, "yyyy-MM-dd");
      const dayEvents = events.filter((e) => eventOccursOnDay(e, day));
      if (dayEvents.length) map.set(key, dayEvents);
    }
    return map;
  }, [calendarDays, events]);

  const selectedWastePickup =
    selectedDay !== null &&
    isWastePickupDay(selectedDay, pickupScheduleMode);
  const selectedEventsVisible = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return visibleDayEvents(
      eventsByDay.get(key) ?? [],
      selectedDay,
      pickupScheduleMode,
    );
  }, [selectedDay, eventsByDay, pickupScheduleMode]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => parseISO(e.end_time) >= now)
      .filter((e) => !isGreenWastePickupCalendarEvent(e))
      .slice(0, 6);
  }, [events]);

  return (
    <div className="space-y-6">
      <AnimateIn>
      <section className="motion-card overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="motion-press rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-hover"
            aria-label="Previous month"
          >
            ←
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              {format(month, "MMMM yyyy")}
            </h2>
            <button
              type="button"
              onClick={() => {
                const today = startOfMonth(new Date());
                setMonth(today);
                setSelectedDay(new Date());
              }}
              className="mt-0.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
            >
              Jump to today
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="motion-press rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-hover"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-accent/60 text-center text-[11px] font-bold uppercase tracking-wide text-muted">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-1 py-2">
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = visibleDayEvents(
              eventsByDay.get(key) ?? [],
              day,
              pickupScheduleMode,
            );
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            const selected = selectedDay ? isSameDay(day, selectedDay) : false;
            const wastePickup =
              inMonth && isWastePickupDay(day, pickupScheduleMode);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={
                  selected
                    ? "relative min-h-[4.5rem] border-b border-r border-line bg-brand-50 p-1.5 text-left transition sm:min-h-[5.5rem] dark:bg-brand-950/40"
                    : inMonth
                      ? "relative min-h-[4.5rem] border-b border-r border-line p-1.5 text-left transition hover:bg-hover sm:min-h-[5.5rem]"
                      : "relative min-h-[4.5rem] border-b border-r border-line bg-canvas/50 p-1.5 text-left sm:min-h-[5.5rem]"
                }
              >
                <span
                  className={
                    today
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
                      : inMonth
                        ? "text-xs font-semibold text-ink"
                        : "text-xs font-medium text-muted"
                  }
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {wastePickup ? (
                    <p
                      className="truncate rounded-md bg-emerald-600/15 px-1 py-0.5 text-[10px] font-semibold leading-tight text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                      title={wastePickupDayNote(day, pickupScheduleMode) ?? GREEN_WASTE_PICKUP_LABEL}
                    >
                      {GREEN_WASTE_PICKUP_LABEL}
                    </p>
                  ) : null}
                  {dayEvents.slice(0, wastePickup ? 1 : 2).map((event) => (
                    <p
                      key={event.id}
                      className="truncate rounded-md bg-brand-600/10 px-1 py-0.5 text-[10px] font-semibold leading-tight text-brand-800 dark:bg-brand-900/50 dark:text-brand-200"
                      title={event.title}
                    >
                      {event.title}
                    </p>
                  ))}
                  {dayEvents.length > (wastePickup ? 1 : 2) && (
                    <p className="px-1 text-[10px] font-medium text-muted">
                      +{dayEvents.length - (wastePickup ? 1 : 2)} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
      </AnimateIn>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnimateIn delay={80}>
        <section className="motion-card rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-bold text-ink">
            {selectedDay
              ? format(selectedDay, "EEEE, MMMM d")
              : "Select a day"}
          </h3>
          {selectedDay && !selectedWastePickup && selectedEventsVisible.length === 0 && (
            <p className="mt-2 text-sm text-muted">No maintenance scheduled.</p>
          )}
          <ul className="mt-3 space-y-3">
            {selectedWastePickup && selectedDay ? (
              <GreenWastePickupDetail
                day={selectedDay}
                mode={pickupScheduleMode}
              />
            ) : null}
            {selectedEventsVisible.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-line bg-canvas/40 p-3"
              >
                <p className="font-semibold text-ink">{event.title}</p>
                <p className="mt-0.5 text-xs font-medium text-brand-700 dark:text-brand-300">
                  {formatEventTime(event)}
                </p>
                {event.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                    {event.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
        </AnimateIn>

        <AnimateIn delay={140}>
        <section className="motion-card rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-bold text-ink">Coming up</h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No upcoming events in the current range.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted">
                      {formatEventTime(event)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {format(parseISO(event.start_time), "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        </AnimateIn>
      </div>
    </div>
  );
}
