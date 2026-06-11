import type { MapPositions } from "@/lib/map-positions";

export type MapMarkerKind = "lot" | "place" | "valve";

export type MapEditIssue = {
  id: string;
  kind: MapMarkerKind;
  severity: "error" | "warning";
  code: "missing" | "invalid" | "orphan" | "duplicate";
  message: string;
  label: string;
};

type Coord = { x: number; y: number };

export function isValidCoord(pos: Coord | null | undefined): boolean {
  if (!pos) return false;
  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return false;
  return pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;
}

function findDuplicateCoords(
  entries: { kind: MapMarkerKind; label: string; pos: Coord }[],
  threshold = 0.6,
): MapEditIssue[] {
  const issues: MapEditIssue[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i];
      const b = entries[j];
      const dx = a.pos.x - b.pos.x;
      const dy = a.pos.y - b.pos.y;
      if (Math.hypot(dx, dy) <= threshold) {
        issues.push({
          id: `duplicate-${a.kind}-${a.label}-${b.kind}-${b.label}`,
          kind: a.kind,
          severity: "warning",
          code: "duplicate",
          message: `${a.label} and ${b.label} are stacked at nearly the same spot (${a.pos.x.toFixed(1)}%, ${a.pos.y.toFixed(1)}%).`,
          label: a.label,
        });
      }
    }
  }
  return issues;
}

export function validateMapPositions(input: {
  lots: MapPositions["lots"];
  places: MapPositions["places"];
  valves: MapPositions["valves"];
  sheetLots: string[];
  sheetValveIds: string[];
}): MapEditIssue[] {
  const { lots, places, valves, sheetLots, sheetValveIds } = input;
  const issues: MapEditIssue[] = [];
  const sheetLotSet = new Set(sheetLots.map((l) => l.trim()).filter(Boolean));
  const sheetValveSet = new Set(sheetValveIds.map((v) => v.trim()).filter(Boolean));

  for (const lot of sheetLotSet) {
    const pos = lots[lot];
    if (!pos) {
      issues.push({
        id: `missing-lot-${lot}`,
        kind: "lot",
        severity: "error",
        code: "missing",
        message: `Lot ${lot} is on the valve sheet but has no map coordinates.`,
        label: lot,
      });
      continue;
    }
    if (!isValidCoord(pos)) {
      issues.push({
        id: `invalid-lot-${lot}`,
        kind: "lot",
        severity: "error",
        code: "invalid",
        message: `Lot ${lot} has invalid coordinates (${pos.x}, ${pos.y}) — must be 0–100%.`,
        label: lot,
      });
    }
  }

  for (const [lot, pos] of Object.entries(lots)) {
    if (sheetLotSet.has(lot)) continue;
    if (!isValidCoord(pos)) {
      issues.push({
        id: `invalid-lot-${lot}`,
        kind: "lot",
        severity: "error",
        code: "invalid",
        message: `Lot ${lot} has invalid coordinates on the map.`,
        label: lot,
      });
      continue;
    }
    issues.push({
      id: `orphan-lot-${lot}`,
      kind: "lot",
      severity: "warning",
      code: "orphan",
      message: `Lot ${lot} is on the map but not found on the valve sheet.`,
      label: lot,
    });
  }

  for (const placeName of Object.keys(places)) {
    const pos = places[placeName];
    if (!isValidCoord(pos)) {
      issues.push({
        id: `missing-place-${placeName}`,
        kind: "place",
        severity: "error",
        code: pos ? "invalid" : "missing",
        message: pos
          ? `Place "${placeName}" has invalid coordinates.`
          : `Place "${placeName}" has no map coordinates.`,
        label: placeName,
      });
    }
  }

  for (const valveId of sheetValveSet) {
    const pos = valves[valveId];
    if (!pos) {
      issues.push({
        id: `missing-valve-${valveId}`,
        kind: "valve",
        severity: "warning",
        code: "missing",
        message: `Valve ${valveId} is on the sheet but has no map pin (optional but recommended).`,
        label: valveId,
      });
      continue;
    }
    if (!isValidCoord(pos)) {
      issues.push({
        id: `invalid-valve-${valveId}`,
        kind: "valve",
        severity: "error",
        code: "invalid",
        message: `Valve ${valveId} has invalid coordinates.`,
        label: valveId,
      });
    }
  }

  for (const [valveId, pos] of Object.entries(valves)) {
    if (sheetValveSet.has(valveId)) continue;
    if (!isValidCoord(pos)) {
      issues.push({
        id: `invalid-valve-${valveId}`,
        kind: "valve",
        severity: "error",
        code: "invalid",
        message: `Valve ${valveId} has invalid coordinates on the map.`,
        label: valveId,
      });
      continue;
    }
    issues.push({
      id: `orphan-valve-${valveId}`,
      kind: "valve",
      severity: "warning",
      code: "orphan",
      message: `Valve ${valveId} is on the map but not on the current valve sheet.`,
      label: valveId,
    });
  }

  const coordEntries: { kind: MapMarkerKind; label: string; pos: Coord }[] = [];
  for (const [label, pos] of Object.entries(lots)) {
    if (isValidCoord(pos)) coordEntries.push({ kind: "lot", label, pos });
  }
  for (const [label, pos] of Object.entries(places)) {
    if (isValidCoord(pos)) coordEntries.push({ kind: "place", label, pos });
  }
  for (const [label, pos] of Object.entries(valves)) {
    if (isValidCoord(pos)) coordEntries.push({ kind: "valve", label, pos });
  }
  issues.push(...findDuplicateCoords(coordEntries));

  const severityRank = { error: 0, warning: 1 };
  const kindRank = { lot: 0, place: 1, valve: 2 };
  return issues.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    if (kindRank[a.kind] !== kindRank[b.kind]) {
      return kindRank[a.kind] - kindRank[b.kind];
    }
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });
}

export function summarizeMapEditIssues(issues: MapEditIssue[]): {
  errors: number;
  warnings: number;
  ok: boolean;
} {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  return { errors, warnings, ok: errors === 0 };
}
