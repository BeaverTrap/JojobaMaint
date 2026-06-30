import type { UnitTone } from "@/lib/facility-unit-status";

export type FacilityUnitState = "ok" | "out";

export function defaultStatuses(count: number): FacilityUnitState[] {
  return Array.from({ length: count }, () => "ok");
}

/** Ensure status array length matches equipment count; optional legacy ooo fallback. */
export function normalizeStatuses(
  count: number,
  raw: FacilityUnitState[] | string[] | null | undefined,
  legacyOut?: number,
): FacilityUnitState[] {
  const parsed = (raw ?? [])
    .map((value) => (value === "out" ? "out" : "ok"))
    .slice(0, count);

  if (parsed.length === count) return parsed;

  if (parsed.length > 0) {
    return [...parsed, ...defaultStatuses(count - parsed.length)];
  }

  if (legacyOut && legacyOut > 0) {
    return Array.from({ length: count }, (_, index) =>
      index < legacyOut ? "out" : "ok",
    );
  }

  return defaultStatuses(count);
}

export function countOut(statuses: FacilityUnitState[]): number {
  return statuses.filter((status) => status === "out").length;
}

export function statesTone(
  statuses: FacilityUnitState[],
  closed = false,
): UnitTone {
  if (closed) return "alert";
  const total = statuses.length;
  const out = countOut(statuses);
  if (total === 0 || out === 0) return "ok";
  if (out >= total) return "alert";
  return "warn";
}

export function statesSummary(
  statuses: FacilityUnitState[],
  singular: string,
  plural?: string,
): string {
  const count = statuses.length;
  if (count === 0) return "";
  const out = countOut(statuses);
  const pluralLabel = plural ?? `${singular}s`;
  if (out === 0) return `All ${count} open`;
  if (out >= count) {
    return count === 1 ? "Out of order" : `All ${count} down`;
  }
  const unitLabel = out === 1 ? singular : pluralLabel;
  return `${out} ${unitLabel} down · ${count - out} open`;
}

export function toggleUnitAt(
  statuses: FacilityUnitState[],
  index: number,
): FacilityUnitState[] {
  return statuses.map((status, i) =>
    i === index ? (status === "ok" ? "out" : "ok") : status,
  );
}

export function setAllUnits(
  statuses: FacilityUnitState[],
  state: FacilityUnitState,
): FacilityUnitState[] {
  return statuses.map(() => state);
}
