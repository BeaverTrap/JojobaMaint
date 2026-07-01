import {
  PARK_WEATHER_LOCATION_LABEL,
  fetchParkWeatherSnapshot,
  getParkWeatherCoordinates,
  weatherCodeLabel,
} from "@/lib/park-weather";
import { PARK_TIMEZONE } from "@/lib/park-time";
import { fetchNasaApod } from "@/lib/sky/apod";
import { fetchParkAstronomy } from "@/lib/sky/astronomy";
import { fetchNearbyEarthquakes } from "@/lib/sky/earthquakes";
import { fetchIssPasses } from "@/lib/sky/iss-passes";
import { fetchVandenbergLaunches } from "@/lib/sky/launches";
import { fetchNwsAlerts } from "@/lib/sky/nws-alerts";
import { computeNightSky } from "@/lib/sky/planets";
import type {
  NightSkyTonight,
  ParkWeatherHourly,
  SkyFeedId,
  SkyPageData,
} from "@/lib/sky/types";

type OpenMeteoHourlyResponse = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
    uv_index?: number[];
    is_day?: number[];
  };
};

async function fetchHourlyForecast(
  lat: number,
  lng: number,
): Promise<ParkWeatherHourly[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index,is_day",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", PARK_TIMEZONE);
  url.searchParams.set("forecast_hours", "48");

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) {
    throw new Error(`Hourly forecast unavailable (${res.status})`);
  }

  const json = (await res.json()) as OpenMeteoHourlyResponse;
  const times = json.hourly?.time ?? [];

  return times.slice(0, 48).map((time, i) => {
    const code = json.hourly?.weather_code?.[i] ?? 0;
    const uv = json.hourly?.uv_index?.[i];
    return {
      time,
      temperatureF: Math.round(json.hourly?.temperature_2m?.[i] ?? 0),
      precipChancePercent: Math.round(
        json.hourly?.precipitation_probability?.[i] ?? 0,
      ),
      weatherLabel: weatherCodeLabel(code),
      weatherCode: code,
      windMph: Math.round(json.hourly?.wind_speed_10m?.[i] ?? 0),
      uvIndex:
        uv != null && Number.isFinite(uv) ? Math.round(uv * 10) / 10 : null,
      isDay: (json.hourly?.is_day?.[i] ?? 1) !== 0,
    };
  });
}

async function loadFeed<T>(
  id: SkyFeedId,
  errors: Partial<Record<SkyFeedId, string>>,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    errors[id] =
      err instanceof Error ? err.message : "Could not load this section.";
    return fallback;
  }
}

export async function fetchSkyPageData(): Promise<SkyPageData> {
  const { lat, lng } = getParkWeatherCoordinates();
  const errors: Partial<Record<SkyFeedId, string>> = {};

  const base = await fetchParkWeatherSnapshot();

  let hourly: ParkWeatherHourly[] = [];
  try {
    hourly = await fetchHourlyForecast(lat, lng);
  } catch {
    /* hourly is optional enhancement */
  }

  const [astronomy, alerts, earthquakes, issPasses, apod] = await Promise.all([
    loadFeed("astronomy", errors, () => fetchParkAstronomy(lat, lng), null),
    loadFeed("alerts", errors, () => fetchNwsAlerts(lat, lng), []),
    loadFeed("earthquakes", errors, () => fetchNearbyEarthquakes(lat, lng), []),
    loadFeed("iss", errors, () => fetchIssPasses(lat, lng), []),
    loadFeed("apod", errors, () => fetchNasaApod(), null),
  ]);

  const launches = await loadFeed(
    "launches",
    errors,
    () =>
      fetchVandenbergLaunches(
        astronomy?.sunset ?? null,
        base.current.weatherCode,
      ),
    [],
  );

  // Locally computed (no network) — fast and reliable.
  let nightSky: NightSkyTonight | null = null;
  try {
    nightSky = computeNightSky(lat, lng);
  } catch (err) {
    errors.planets =
      err instanceof Error ? err.message : "Could not compute the night sky.";
  }

  return {
    locationLabel: PARK_WEATHER_LOCATION_LABEL,
    latitude: lat,
    longitude: lng,
    fetchedAt: base.fetchedAt,
    current: base.current,
    daily: base.daily,
    hourly,
    airQuality: base.airQuality,
    astronomy,
    alerts,
    earthquakes,
    launches,
    issPasses,
    nightSky,
    apod,
    errors,
  };
}
