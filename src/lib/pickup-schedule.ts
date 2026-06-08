export type PickupScheduleMode = "summer" | "regular";

export function pickupScheduleFromFlag(isSummer: boolean): PickupScheduleMode {
  return isSummer ? "summer" : "regular";
}

export function pickupScheduleLabel(mode: PickupScheduleMode): string {
  return mode === "summer"
    ? "Summer schedule · Mondays only"
    : "Regular schedule · Mondays & Thursdays";
}

export function pickupBannerPreview(mode: PickupScheduleMode): string {
  return mode === "summer"
    ? "SUMMER SCHEDULE: Mondays Only — Thursday pickups paused."
    : "Regular season: pickups on Mondays and Thursdays.";
}
