import { Body, Illumination, MoonPhase } from "astronomy-engine";
import { moonPhaseLabel } from "@/lib/moon-phase";
import { parkCalendarNoon } from "@/lib/park-time";

/** Synodic month length in days (astronomy-engine reference). */
export const SYNODIC_MONTH_DAYS = 29.530588853;

/**
 * Geocentric synodic phase 0–1 from astronomy-engine.
 * 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
 */
export function moonSynodicPhase(date: Date): number {
  const degrees = MoonPhase(date);
  return (((degrees % 360) + 360) % 360) / 360;
}

/** Days since the most recent new moon. */
export function moonAgeDays(date: Date): number {
  return Math.round(moonSynodicPhase(date) * SYNODIC_MONTH_DAYS * 10) / 10;
}

export function moonIlluminationPercent(date: Date): number {
  return Math.round(Illumination(Body.Moon, date).phase_fraction * 100);
}

/** Calendar date at park-local noon — stable daily phase for forecast rows. */
export function moonPhaseForDateIso(dateIso: string): number {
  return moonSynodicPhase(parkCalendarNoon(dateIso));
}

export function moonIlluminationPercentForDateIso(dateIso: string): number {
  return moonIlluminationPercent(parkCalendarNoon(dateIso));
}

export function moonPhaseLabelForDate(date: Date): string {
  return moonPhaseLabel(moonSynodicPhase(date), moonIlluminationPercent(date));
}

export function moonPhaseLabelForDateIso(dateIso: string): string {
  const atNoon = parkCalendarNoon(dateIso);
  return moonPhaseLabel(moonSynodicPhase(atNoon), moonIlluminationPercent(atNoon));
}
