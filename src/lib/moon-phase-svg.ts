/**
 * Illuminated moon disk path (even-odd fill). Phase 0–1: 0=new, 0.5=full.
 * @see https://stackoverflow.com/questions/60121394/drawing-a-moon-phase-dial-in-d3
 */
export function moonPhaseLightPath(
  cx: number,
  cy: number,
  r: number,
  phase: number,
): string | null {
  const p = ((phase % 1) + 1) % 1;

  if (p < 0.02 || p > 0.98) {
    return null;
  }

  if (p > 0.48 && p < 0.52) {
    return `M ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy} Z`;
  }

  if (p < 0.5) {
    const ip = (1 - p * 2) * r;
    return `M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} M ${cx + ip},${cy - r} A ${r},${r} 0 0,0 ${cx + ip},${cy + r} A ${r},${r} 0 0,0 ${cx + ip},${cy - r} Z`;
  }

  const ip = (p * 2 - 1) * r;
  return `M ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} M ${cx - ip},${cy - r} A ${r},${r} 0 0,1 ${cx - ip},${cy + r} A ${r},${r} 0 0,1 ${cx - ip},${cy - r} Z`;
}

export function isNearNewMoon(phase: number): boolean {
  const p = ((phase % 1) + 1) % 1;
  return p < 0.02 || p > 0.98;
}

export function isNearFullMoon(phase: number): boolean {
  const p = ((phase % 1) + 1) % 1;
  return p > 0.48 && p < 0.52;
}
