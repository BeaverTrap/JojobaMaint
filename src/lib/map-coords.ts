import { percentToLatLng, type MapLatLng } from "@/lib/map-geography";

/** Legacy positions use x/y as 0–100% on the schematic map. Google edits store x=lng, y=lat. */
export function isGeoCoords(pos: { x: number; y: number }): boolean {
  if (pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100) {
    return false;
  }
  return (
    pos.y >= -90 &&
    pos.y <= 90 &&
    pos.x >= -180 &&
    pos.x <= 180
  );
}

export function mapPositionToLatLng(pos: { x?: number; y?: number }): MapLatLng {
  const x = pos.x ?? NaN;
  const y = pos.y ?? NaN;
  if (isGeoCoords({ x, y })) {
    return { lat: y, lng: x };
  }
  return percentToLatLng(x, y);
}

export function latLngToMapPosition(
  lat: number,
  lng: number,
): { x: number; y: number } {
  return {
    x: Math.round(lng * 1_000_000) / 1_000_000,
    y: Math.round(lat * 1_000_000) / 1_000_000,
  };
}

export function formatMapPosition(pos: { x: number; y: number }): string {
  if (isGeoCoords(pos)) {
    return `${pos.y.toFixed(5)}, ${pos.x.toFixed(5)}`;
  }
  return `${pos.x.toFixed(1)}%, ${pos.y.toFixed(1)}%`;
}
