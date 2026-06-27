/** Synodic lunar phase 0–1 (0 = new, 0.5 = full, 1 = new). */

export const MOON_PHASE_LABELS = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;

export type MoonPhaseIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const SYNODIC_MONTH_SEC = 29.530588853 * 86_400;
/** Known new moon — 2000-01-06 18:14 UTC (common astronomical reference). */
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export function moonPhaseForDate(date: Date): number {
  const elapsedSec = (date.getTime() - KNOWN_NEW_MOON_MS) / 1000;
  let phase = (elapsedSec % SYNODIC_MONTH_SEC) / SYNODIC_MONTH_SEC;
  if (phase < 0) phase += 1;
  return phase;
}

/** Calendar date `YYYY-MM-DD` at local noon — stable across US timezones. */
export function moonPhaseForDateIso(dateIso: string): number {
  return moonPhaseForDate(new Date(`${dateIso}T12:00:00`));
}

export function moonPhaseIndex(phase: number): MoonPhaseIndex {
  const idx = Math.min(7, Math.max(0, Math.round(phase * 8) % 8));
  return idx as MoonPhaseIndex;
}

export function moonPhaseLabel(phase: number): string {
  return MOON_PHASE_LABELS[moonPhaseIndex(phase)] ?? "Moon";
}

/** Number of hand-drawn frames in /public/images/luner_cycle-assets (1 = new, 15 = full). */
export const MOON_CYCLE_FRAMES = 28;

/** Map a 0–1 synodic phase to a 1..28 frame number, wrapping at the new moon. */
export function moonPhaseFrame(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  return (Math.round(p * MOON_CYCLE_FRAMES) % MOON_CYCLE_FRAMES) + 1;
}

export function moonPhaseFrameSrc(phase: number): string {
  return `/images/luner_cycle-assets/${moonPhaseFrame(phase)}.png`;
}
