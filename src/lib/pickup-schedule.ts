import { addDays } from "date-fns";
import type { CalendarEvent } from "@/lib/database.types";
import { isFederalHolidayObserved } from "@/lib/pickup-holidays";

export type PickupScheduleMode = "summer" | "regular";

export const GREEN_WASTE_PICKUP_LABEL = "Green Waste Pickup";

const PICKUP_EVENT_TITLE =
  /green\s*waste|cactus\s*(waste\s*)?pickup|waste\s*pickup/i;

export function pickupScheduleFromFlag(isSummer: boolean): PickupScheduleMode {
  return isSummer ? "summer" : "regular";
}

/** Tuesday makeup when the prior Monday was a federal holiday. */
export function isWastePickupMakeupDay(
  day: Date,
  mode: PickupScheduleMode,
): boolean {
  if (day.getDay() !== 2) return false;
  const monday = addDays(day, -1);
  return isFederalHolidayObserved(monday);
}

export function isWastePickupDay(
  day: Date,
  mode: PickupScheduleMode,
): boolean {
  const weekday = day.getDay();

  if (mode === "regular" && weekday === 4) {
    return true;
  }

  if (weekday === 1) {
    return !isFederalHolidayObserved(day);
  }

  if (weekday === 2) {
    return isWastePickupMakeupDay(day, mode);
  }

  return false;
}

export function wastePickupDayNote(
  day: Date,
  mode: PickupScheduleMode,
): string | null {
  if (!isWastePickupDay(day, mode)) return null;
  if (isWastePickupMakeupDay(day, mode)) {
    return "Moved from Monday — federal holiday.";
  }
  return null;
}

/** Hide synced calendar entries that duplicate the computed pickup schedule. */
export function isGreenWastePickupCalendarEvent(event: CalendarEvent): boolean {
  return PICKUP_EVENT_TITLE.test(event.title);
}

export function pickupScheduleLabel(mode: PickupScheduleMode): string {
  return mode === "summer"
    ? "Summer schedule · Mondays only"
    : "Regular schedule · Mondays & Thursdays";
}

export function pickupBannerPreview(mode: PickupScheduleMode): string {
  return mode === "summer"
    ? "SUMMER SCHEDULE: Mondays only — Thursday pickups paused."
    : "Regular season: waste pickups on Mondays and Thursdays.";
}
