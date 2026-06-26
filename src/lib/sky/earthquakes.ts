import type { RecentEarthquake } from "@/lib/sky/types";

type UsgsResponse = {
  features?: Array<{
    id?: string;
    properties?: {
      mag?: number;
      place?: string;
      time?: number;
      url?: string;
    };
    geometry?: {
      coordinates?: [number, number, number?];
    };
  }>;
};

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearbyEarthquakes(
  lat: number,
  lng: number,
  maxRadiusKm = 250,
  minMagnitude = 2.5,
  limit = 25,
): Promise<RecentEarthquake[]> {
  const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("maxradiuskm", String(maxRadiusKm));
  url.searchParams.set("minmagnitude", String(minMagnitude));
  url.searchParams.set("starttime", startTime);
  url.searchParams.set("orderby", "time");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) {
    throw new Error(`USGS earthquake feed unavailable (${res.status})`);
  }

  const json = (await res.json()) as UsgsResponse;
  return (json.features ?? [])
    .map((f) => {
      const mag = f.properties?.mag;
      const place = f.properties?.place;
      const timeMs = f.properties?.time;
      const coords = f.geometry?.coordinates;
      if (mag == null || !place || timeMs == null || !coords) return null;
      const [eqLng, eqLat, depth] = coords;
      return {
        id: f.id ?? `${timeMs}`,
        magnitude: mag,
        place,
        time: new Date(timeMs).toISOString(),
        distanceMiles: Math.round(haversineMiles(lat, lng, eqLat, eqLng)),
        depthKm: depth != null ? Math.round(depth * 10) / 10 : null,
        latitude: eqLat,
        longitude: eqLng,
        url: f.properties?.url ?? "https://earthquake.usgs.gov/",
      } satisfies RecentEarthquake;
    })
    .filter((e): e is RecentEarthquake => e != null);
}
