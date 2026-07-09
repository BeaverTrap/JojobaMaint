import { addDays, format } from "date-fns";

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Federal fixed-date holiday, observed Fri if Sat / Mon if Sun. */
function observeFixedHoliday(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 0) return dateKey(addDays(d, 1));
  if (dow === 6) return dateKey(addDays(d, -1));
  return dateKey(d);
}

function nthMonday(year: number, month: number, n: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 1) {
      count++;
      if (count === n) return dateKey(d);
    }
  }
  throw new Error(`nth Monday not found: ${year}-${month}-${n}`);
}

function lastMonday(year: number, month: number): string {
  const last = new Date(year, month, 0);
  while (last.getDay() !== 1) {
    last.setDate(last.getDate() - 1);
  }
  return dateKey(last);
}

/** US federal holidays as observed on the calendar (park uses these for Monday skips). */
export function federalHolidayDates(year: number): Set<string> {
  const dates = new Set<string>();
  dates.add(observeFixedHoliday(year, 1, 1));
  dates.add(nthMonday(year, 1, 3));
  dates.add(nthMonday(year, 2, 3));
  dates.add(lastMonday(year, 5));
  dates.add(observeFixedHoliday(year, 6, 19));
  dates.add(observeFixedHoliday(year, 7, 4));
  dates.add(nthMonday(year, 9, 1));
  dates.add(nthMonday(year, 10, 2));
  dates.add(observeFixedHoliday(year, 11, 11));
  dates.add(observeFixedHoliday(year, 12, 25));
  return dates;
}

export function isFederalHolidayObserved(day: Date): boolean {
  return federalHolidayDates(day.getFullYear()).has(dateKey(day));
}

/** Name of the observed federal holiday on this calendar day, if any. */
export function getFederalHolidayName(day: Date): string | null {
  const year = day.getFullYear();
  const key = dateKey(day);

  const holidays: [string, string][] = [
    [observeFixedHoliday(year, 1, 1), "New Year's Day"],
    [nthMonday(year, 1, 3), "MLK Day"],
    [nthMonday(year, 2, 3), "Presidents Day"],
    [lastMonday(year, 5), "Memorial Day"],
    [observeFixedHoliday(year, 6, 19), "Juneteenth"],
    [observeFixedHoliday(year, 7, 4), "Independence Day"],
    [nthMonday(year, 9, 1), "Labor Day"],
    [nthMonday(year, 10, 2), "Columbus Day"],
    [observeFixedHoliday(year, 11, 11), "Veterans Day"],
    [observeFixedHoliday(year, 12, 25), "Christmas"],
  ];

  for (const [date, name] of holidays) {
    if (date === key) return name;
  }

  return null;
}

/**
 * Label for the calendar when Monday pickup is skipped (observed federal holiday).
 * Only Mondays — avoids marking observed Friday/Saturday shifts (e.g. July 3 when the 4th is Sat).
 */
export function getFederalPickupHolidayLabel(day: Date): string | null {
  if (day.getDay() !== 1) return null;
  if (!isFederalHolidayObserved(day)) return null;
  return getFederalHolidayName(day);
}
