import type { ParkAstronomyToday } from "@/lib/sky/types";
import { moonPhaseForDateIso, moonPhaseLabelForDateIso } from "@/lib/sky/moon";
import { formatParkDateTime, PARK_TIMEZONE } from "@/lib/park-time";

type AstronomyResponse = {
  daily?: {
    time?: string[];
    sunrise?: string[];
    sunset?: string[];
  };
};

/** Open-Meteo returns sunrise/sunset in park-local time without a UTC offset. */
function parseOpenMeteoLocalHours(iso: string): number | null {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) + Number(match[2]) / 60;
}

export async function fetchParkAstronomy(
  lat: number,
  lng: number,
): Promise<ParkAstronomyToday | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", PARK_TIMEZONE);
  url.searchParams.set("forecast_days", "1");

  const uvUrl = new URL("https://api.open-meteo.com/v1/forecast");
  uvUrl.searchParams.set("latitude", String(lat));
  uvUrl.searchParams.set("longitude", String(lng));
  uvUrl.searchParams.set("daily", "uv_index_max");
  uvUrl.searchParams.set("timezone", PARK_TIMEZONE);
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

  const today = json.daily?.time?.[0] ?? sunrise.slice(0, 10);
  const moonPhase = moonPhaseForDateIso(today);
  const riseH = parseOpenMeteoLocalHours(sunrise);
  const setH = parseOpenMeteoLocalHours(sunset);
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
    moonrise: null,
    moonset: null,
    moonPhase,
    moonPhaseLabel: moonPhaseLabelForDateIso(today),
    daylightHours: Math.round(daylightHours * 10) / 10,
    uvIndexMax,
  };
}

export function formatSkyTime(iso: string): string {
  return formatParkDateTime(iso, {
    hour: "numeric",
    minute: "2-digit",
  });
}
