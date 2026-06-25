import type { ParkAstronomyToday } from "@/lib/sky/types";

type AstronomyResponse = {
  daily?: {
    time?: string[];
    sunrise?: string[];
    sunset?: string[];
    moonrise?: (string | null)[];
    moonset?: (string | null)[];
    moon_phase?: number[];
  };
};

const MOON_LABELS = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];

function moonPhaseLabel(phase: number): string {
  const idx = Math.min(7, Math.max(0, Math.round(phase * 8) % 8));
  return MOON_LABELS[idx] ?? "Moon";
}

function parseTimeToHours(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() + d.getMinutes() / 60;
}

export async function fetchParkAstronomy(
  lat: number,
  lng: number,
): Promise<ParkAstronomyToday | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "sunrise,sunset,moonrise,moonset,moon_phase");
  url.searchParams.set("timezone", "America/Los_Angeles");
  url.searchParams.set("forecast_days", "1");

  const uvUrl = new URL("https://api.open-meteo.com/v1/forecast");
  uvUrl.searchParams.set("latitude", String(lat));
  uvUrl.searchParams.set("longitude", String(lng));
  uvUrl.searchParams.set("daily", "uv_index_max");
  uvUrl.searchParams.set("timezone", "America/Los_Angeles");
  uvUrl.searchParams.set("forecast_days", "1");

  const [res, uvRes] = await Promise.all([
    fetch(url.toString(), { next: { revalidate: 3600 } }),
    fetch(uvUrl.toString(), { next: { revalidate: 3600 } }),
  ]);

  if (!res.ok) return null;

  const json = (await res.json()) as AstronomyResponse;
  const sunrise = json.daily?.sunrise?.[0];
  const sunset = json.daily?.sunset?.[0];
  if (!sunrise || !sunset) return null;

  const moonPhase = json.daily?.moon_phase?.[0] ?? 0;
  const riseH = parseTimeToHours(sunrise);
  const setH = parseTimeToHours(sunset);
  const daylightHours =
    riseH != null && setH != null && setH > riseH ? setH - riseH : 0;

  let uvIndexMax: number | null = null;
  if (uvRes.ok) {
    const uvJson = (await uvRes.json()) as {
      daily?: { uv_index_max?: number[] };
    };
    const uv = uvJson.daily?.uv_index_max?.[0];
    if (uv != null && Number.isFinite(uv)) uvIndexMax = Math.round(uv * 10) / 10;
  }

  return {
    sunrise,
    sunset,
    moonrise: json.daily?.moonrise?.[0] ?? null,
    moonset: json.daily?.moonset?.[0] ?? null,
    moonPhase,
    moonPhaseLabel: moonPhaseLabel(moonPhase),
    daylightHours: Math.round(daylightHours * 10) / 10,
    uvIndexMax,
  };
}

export function formatSkyTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}
