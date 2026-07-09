import type { HolidayMascotRow } from "@/app/api/holiday-mascots/route";

export type HolidayMascot = HolidayMascotRow;

export type HolidayMascotBase = {
  id: string;
  label: string;
  src: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  calendar_month?: number | null;
  calendar_day?: number | null;
  active?: boolean;
};

let cached: HolidayMascot[] | null = null;
let fetchPromise: Promise<HolidayMascot[]> | null = null;

async function load(): Promise<HolidayMascot[]> {
  try {
    const res = await fetch("/api/holiday-mascots");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function getHolidayMascots(onReady?: () => void): HolidayMascot[] {
  if (cached) return cached;
  if (!fetchPromise) {
    fetchPromise = load().then((data) => {
      cached = data;
      return data;
    });
  }
  fetchPromise.then(() => onReady?.());
  return [];
}

export function invalidateHolidayMascots() {
  cached = null;
  fetchPromise = null;
}

/** Check if a given date falls within a mascot's date range. */
export function isDateInRange(
  date: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const startVal = startMonth * 100 + startDay;
  const endVal = endMonth * 100 + endDay;
  const dateVal = month * 100 + day;

  if (startVal <= endVal) {
    return dateVal >= startVal && dateVal <= endVal;
  }
  // Wraps around year boundary (e.g. Dec 15 - Jan 5)
  return dateVal >= startVal || dateVal <= endVal;
}

/** Get all holiday mascots active on a given date. */
export function getActiveHolidayMascots(
  date: Date,
  mascots?: HolidayMascot[],
): HolidayMascot[] {
  const all = mascots ?? cached ?? [];
  return all.filter(
    (m) =>
      m.active &&
      isDateInRange(date, m.start_month, m.start_day, m.end_month, m.end_day),
  );
}

/** Get holiday mascots whose range includes a specific month/day (for calendar rendering). */
export function getMascotsForDay<T extends HolidayMascotBase>(
  month: number,
  day: number,
  mascots?: T[],
): T[] {
  const all = (mascots ?? cached ?? []) as T[];
  const fakeDate = new Date(2000, month - 1, day);
  return all.filter(
    (m) =>
      (m.active !== false) &&
      isDateInRange(fakeDate, m.start_month, m.start_day, m.end_month, m.end_day),
  );
}
