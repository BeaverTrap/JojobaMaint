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

export function moonPhaseIndex(phase: number): MoonPhaseIndex {
  const p = ((phase % 1) + 1) % 1;
  const idx = Math.min(7, Math.floor(p * 8));
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
