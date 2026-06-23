/** Geographic bounds for the park schematic map (ground overlay). Tune in /map/edit if markers drift. */
export type ParkMapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapLatLng = { lat: number; lng: number };
export type MapLatLngBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/**
 * Visible footprint of Jojoba Hills SKP Resort (lots, clubhouse, loops).
 * Framed to the developed park — not the wider Hwy 79 / hillside context.
 * Override with NEXT_PUBLIC_PARK_MAP_BOUNDS=north,south,east,west if needed.
 */
const DEFAULT_PARK_MAP_BOUNDS: ParkMapBounds = {
  north: 33.454,
  south: 33.443,
  east: -116.864,
  west: -116.879,
};

function parseBoundsFromEnv(): ParkMapBounds | null {
  const raw = process.env.NEXT_PUBLIC_PARK_MAP_BOUNDS?.trim();
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [north, south, east, west] = parts;
  return { north, south, east, west };
}

export function getParkMapBounds(): ParkMapBounds {
  return parseBoundsFromEnv() ?? DEFAULT_PARK_MAP_BOUNDS;
}

export function parkMapBoundsLiteral(): MapLatLngBounds {
  const b = getParkMapBounds();
  return { north: b.north, south: b.south, east: b.east, west: b.west };
}

export function parkMapCenter(): MapLatLng {
  const b = getParkMapBounds();
  return {
    lat: (b.north + b.south) / 2,
    lng: (b.east + b.west) / 2,
  };
}

/** Image coords: x = west→east, y = top→bottom (north→south). */
export function percentToLatLng(
  xPercent: number,
  yPercent: number,
): MapLatLng {
  const b = getParkMapBounds();
  return {
    lat: b.north - (yPercent / 100) * (b.north - b.south),
    lng: b.west + (xPercent / 100) * (b.east - b.west),
  };
}

export function latLngToPercent(
  lat: number,
  lng: number,
): { x: number; y: number } {
  const b = getParkMapBounds();
  const x = ((lng - b.west) / (b.east - b.west)) * 100;
  const y = ((b.north - lat) / (b.north - b.south)) * 100;
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

export function isGoogleMapsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

export function googleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export function googleMapId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() || "DEMO_MAP_ID";
}
