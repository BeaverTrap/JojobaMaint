/**
 * Jojoba Hills SKP local time — single source of truth for calendar dates,
 * forecasts, moon phases, and displayed clocks.
 */
export const PARK_TIMEZONE = "America/Los_Angeles";

/** Today's calendar date at the park (YYYY-MM-DD). */
export function parkTodayIso(timeZone: string = PARK_TIMEZONE): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

/**
 * UTC instant for noon on a park-local calendar day (Open-Meteo `time` strings).
 * Avoids `new Date("YYYY-MM-DDT12:00:00")` which follows the server timezone.
 */
export function parkCalendarNoon(
  dateIso: string,
  timeZone: string = PARK_TIMEZONE,
): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  for (let utcHour = 0; utcHour < 24; utcHour += 1) {
    const candidate = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
    const parts = formatter.formatToParts(candidate);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;

    const localYear = Number(get("year"));
    const localMonth = Number(get("month"));
    const localDay = Number(get("day"));
    const localHour = Number(get("hour"));
    const localMinute = Number(get("minute"));

    if (
      localYear === year &&
      localMonth === month &&
      localDay === day &&
      localHour === 12 &&
      localMinute === 0
    ) {
      return candidate;
    }
  }

  return new Date(Date.UTC(year, month - 1, day, 20, 0, 0));
}

/** Format a park calendar day (YYYY-MM-DD) in local park time. */
export function formatParkDate(
  dateIso: string,
  options: Intl.DateTimeFormatOptions,
  timeZone: string = PARK_TIMEZONE,
): string {
  return parkCalendarNoon(dateIso, timeZone).toLocaleDateString("en-US", {
    timeZone,
    ...options,
  });
}

/** Format a UTC instant for display at Jojoba Hills. */
export function formatParkDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
  timeZone: string = PARK_TIMEZONE,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const usesTime =
    options.hour !== undefined ||
    options.minute !== undefined ||
    options.second !== undefined;

  if (usesTime) {
    return date.toLocaleTimeString("en-US", { timeZone, ...options });
  }

  return date.toLocaleDateString("en-US", { timeZone, ...options });
}

/** Calendar month 1–12 for a park-local date string. */
export function parkMonthFromDateIso(
  dateIso: string,
  timeZone: string = PARK_TIMEZONE,
): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      timeZone,
    }).format(parkCalendarNoon(dateIso, timeZone)),
  );
}

/**
 * Open-Meteo returns timestamps in the requested timezone without a UTC offset
 * (e.g. `2026-06-30T14:00`). Convert to a real UTC instant for comparisons.
 */
export function openMeteoLocalToDate(
  isoLocal: string,
  timeZone: string = PARK_TIMEZONE,
): Date {
  const [datePart, timePart = "12:00"] = isoLocal.split("T");
  const [hourText, minuteText = "0"] = timePart.split(":");
  const [year, month, day] = datePart.split("-").map(Number);
  const targetHour = Number(hourText);
  const targetMinute = Number(minuteText);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const start = Date.UTC(year, month - 1, day - 1, 0, 0, 0);
  const end = Date.UTC(year, month - 1, day + 2, 0, 0, 0);

  for (let utcMs = start; utcMs < end; utcMs += 15 * 60 * 1000) {
    const candidate = new Date(utcMs);
    const parts = formatter.formatToParts(candidate);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);

    if (
      get("year") === year &&
      get("month") === month &&
      get("day") === day &&
      get("hour") === targetHour &&
      get("minute") === targetMinute
    ) {
      return candidate;
    }
  }

  return parkCalendarNoon(datePart, timeZone);
}

/** Display time from an Open-Meteo local timestamp string. */
export function formatOpenMeteoLocalTime(
  isoLocal: string,
  timeZone: string = PARK_TIMEZONE,
): string {
  return formatParkDateTime(openMeteoLocalToDate(isoLocal, timeZone), {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Display weekday from an Open-Meteo local timestamp string. */
export function formatOpenMeteoLocalWeekday(
  isoLocal: string,
  timeZone: string = PARK_TIMEZONE,
): string {
  return formatParkDateTime(openMeteoLocalToDate(isoLocal, timeZone), {
    weekday: "short",
  });
}
