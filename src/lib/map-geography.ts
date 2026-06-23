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
 * Schematic / percent-coordinate alignment box. Changing this shifts legacy %-based
 * markers on the roadmap — tune only when calibrating the schematic.
 * Override with NEXT_PUBLIC_PARK_MAP_BOUNDS=north,south,east,west.
 */
const DEFAULT_PARK_MAP_BOUNDS: ParkMapBounds = {
  north: 33.456,
  south: 33.441,
  east: -116.865,
  west: -116.881,
};

/** Extra east longitude (degrees) for pan/zoom — covers east amenities (shooting range, dog runs, aviation). */
const DEFAULT_VIEW_EAST_EXTENSION = 0.022;

/**
 * Main resort center (clubhouse / Hwy 79 frontage). Startup view targets this —
 * not the schematic box center, which sits east of the developed loops.
 */
const DEFAULT_RESORT_CENTER: MapLatLng = {
  lat: 33.4482,
  lng: -116.8715,
};

/**
 * Tight frame for the developed resort (lots + clubhouse). Excludes far-east
 * amenities so the map opens on Jojoba Hills, not across the street.
 */
const DEFAULT_PARK_FOCUS_BOUNDS: ParkMapBounds = {
  north: 33.454,
  south: 33.443,
  east: -116.864,
  west: -116.879,
};

function parseBoundsFromEnv(raw: string | undefined): ParkMapBounds | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [north, south, east, west] = parts;
  return { north, south, east, west };
}

function parseCenterFromEnv(raw: string | undefined): MapLatLng | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lat, lng] = parts;
  return { lat, lng };
}

export function getParkMapBounds(): ParkMapBounds {
  return parseBoundsFromEnv(process.env.NEXT_PUBLIC_PARK_MAP_BOUNDS) ?? DEFAULT_PARK_MAP_BOUNDS;
}

/** Startup / reset frame — main resort only, not the full schematic extent. */
export function getParkFocusBounds(): ParkMapBounds {
  return (
    parseBoundsFromEnv(process.env.NEXT_PUBLIC_PARK_FOCUS_BOUNDS) ??
    DEFAULT_PARK_FOCUS_BOUNDS
  );
}

/** Wider box for pan limits only — extends east beyond the schematic box. */
export function getParkViewBounds(): ParkMapBounds {
  const viewOverride = parseBoundsFromEnv(process.env.NEXT_PUBLIC_PARK_VIEW_BOUNDS);
  if (viewOverride) return viewOverride;

  const coord = getParkMapBounds();
  return {
    ...coord,
    east: coord.east + DEFAULT_VIEW_EAST_EXTENSION,
  };
}

export function parkMapBoundsLiteral(): MapLatLngBounds {
  const b = getParkMapBounds();
  return { north: b.north, south: b.south, east: b.east, west: b.west };
}

export function parkFocusBoundsLiteral(): MapLatLngBounds {
  const b = getParkFocusBounds();
  return { north: b.north, south: b.south, east: b.east, west: b.west };
}

export function parkViewBoundsLiteral(): MapLatLngBounds {
  const b = getParkViewBounds();
  return { north: b.north, south: b.south, east: b.east, west: b.west };
}

export function parkMapCenter(): MapLatLng {
  return (
    parseCenterFromEnv(process.env.NEXT_PUBLIC_PARK_FOCUS_CENTER) ??
    DEFAULT_RESORT_CENTER
  );
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
