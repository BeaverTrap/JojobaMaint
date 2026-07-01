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

/** Approximate illumination 0–100 from synodic phase alone. */
export function moonIlluminationPercentFromPhase(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  return Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
}

export function moonPhaseIndex(phase: number): MoonPhaseIndex {
  const p = ((phase % 1) + 1) % 1;
  const idx = Math.min(7, Math.floor(p * 8));
  return idx as MoonPhaseIndex;
}

/**
 * Human-readable phase name. Pass `illuminationPercent` when available so
 * "Full moon" only appears when the disk is actually full (not 98% gibbous).
 */
export function moonPhaseLabel(
  phase: number,
  illuminationPercent?: number,
): string {
  const p = ((phase % 1) + 1) % 1;
  const illum =
    illuminationPercent ?? moonIlluminationPercentFromPhase(phase);

  if (illum <= 1) return "New moon";

  // Full moon is a narrow window around phase 0.5 with ~100% illumination.
  if (illum >= 99 && p >= 0.47 && p <= 0.52) return "Full moon";

  if (p < 0.19) return "Waxing crescent";
  if (p < 0.28) return "First quarter";
  if (p < 0.47) return "Waxing gibbous";
  if (p < 0.72) return "Waning gibbous";
  if (p < 0.81) return "Last quarter";
  return "Waning crescent";
}

/** Number of hand-drawn frames in /public/images/luner_cycle-assets (1 = new, 15 = full). */
export const MOON_CYCLE_FRAMES = 28;

/** Map a 0–1 synodic phase to a 1..28 frame number, wrapping at the new moon. */
export function moonPhaseFrame(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  let frame = Math.round(p * MOON_CYCLE_FRAMES);
  if (frame === 0) frame = MOON_CYCLE_FRAMES;

  // Once clearly past full, don't show the full-moon disk (frame 15).
  if (p > 0.52 && frame <= 15) return 16;
  // Once clearly before full, don't show waning-side frames.
  if (p < 0.48 && frame >= 16) return 14;

  return frame;
}

export function moonPhaseFrameSrc(phase: number): string {
  return `/images/luner_cycle-assets/${moonPhaseFrame(phase)}.png`;
}
