import { getZoneFillColor } from "@/lib/zone-colors";
import type { ZoneColorMap } from "@/lib/zone-colors";

export type ZoneBlob = { points: { x: number; y: number }[]; fill: string };

/** Convex hull (gift wrapping) of points in % coords. */
export function convexHull(
  points: { x: number; y: number }[],
): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const out: { x: number; y: number }[] = [];
  let left = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[left].x) left = i;
  }
  let p = left;
  do {
    out.push(points[p]);
    let q = (p + 1) % points.length;
    for (let r = 0; r < points.length; r++) {
      if (r === p || r === q) continue;
      const cross =
        (points[q].x - points[p].x) * (points[r].y - points[p].y) -
        (points[q].y - points[p].y) * (points[r].x - points[p].x);
      if (cross < 0) q = r;
    }
    p = q;
  } while (p !== left);
  return out;
}

export function computeZoneBlobs({
  lotsToShow,
  lots,
  lotZones,
  contextZones,
  contextZone,
  zoneColors,
}: {
  lotsToShow: string[];
  lots: Record<string, { x: number; y: number }>;
  lotZones: Record<string, string[]>;
  contextZones: string[];
  contextZone: string | null;
  zoneColors: ZoneColorMap;
}): ZoneBlob[] {
  if (lotsToShow.length === 0) return [];

  const zoneToLots = new Map<string, string[]>();
  for (const lotId of lotsToShow) {
    const zones = lotZones[lotId] ?? (contextZone ? [contextZone] : []);
    const zone = contextZones?.length
      ? (contextZones.find((z) => zones.includes(z)) ?? zones[0])
      : (zones[0] ?? (contextZone || "Zone"));
    if (!zoneToLots.has(zone)) zoneToLots.set(zone, []);
    zoneToLots.get(zone)!.push(lotId);
  }

  const zoneOrderForFill =
    Object.keys(zoneColors).length > 0
      ? Object.keys(zoneColors).sort((a, b) => a.localeCompare(b))
      : contextZones.length > 0
        ? [...contextZones].sort((a, b) => a.localeCompare(b))
        : contextZone
          ? [contextZone]
          : [];

  const result: ZoneBlob[] = [];
  zoneToLots.forEach((lotIds, zoneName) => {
    const points = lotIds
      .map((id) => lots[id])
      .filter((p): p is { x: number; y: number } => p != null);
    if (points.length < 3) return;
    result.push({
      points: convexHull(points),
      fill: getZoneFillColor(zoneName, zoneOrderForFill),
    });
  });
  return result;
}
