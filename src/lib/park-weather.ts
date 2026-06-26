import { parkMapCenter } from "@/lib/map-geography";
import { moonPhaseForDateIso } from "@/lib/moon-phase";

export type ParkWeatherCurrent = {
  temperatureF: number;
  apparentTemperatureF: number;
  humidityPercent: number;
  windMph: number;
  windDirection: string;
  weatherLabel: string;
  weatherCode: number;
  /** From Open-Meteo `is_day` — false after sunset for clear-sky night treatment. */
  isDay: boolean;
};

export type ParkWeatherDaily = {
  date: string;
  highF: number;
  lowF: number;
  precipChancePercent: number;
  weatherLabel: string;
  weatherCode: number;
  /** 0 = new moon, 0.5 = full — computed locally (Open-Meteo moon_phase unavailable). */
  moonPhase: number;
};

export type ParkWeatherAirQuality = {
  usAqi: number | null;
  pm25: number | null;
  label: string;
} | null;

export type ParkWeatherSnapshot = {
  locationLabel: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
  current: ParkWeatherCurrent;
  daily: ParkWeatherDaily[];
  airQuality: ParkWeatherAirQuality;
};

export const PARK_WEATHER_LOCATION_LABEL = "Jojoba Hills SKP, Aguanga CA";
export const PARK_WEATHER_BAR_LABEL = "Jojoba Weather";
/** IANA timezone for park weather, forecasts, and local clock. */
export const PARK_TIMEZONE = "America/Los_Angeles";

export function getParkWeatherCoordinates(): { lat: number; lng: number } {
  return parkMapCenter();
}

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

export function weatherCodeLabel(code: number): string {
  return WMO_LABELS[code] ?? "Unknown";
}

function windDirectionLabel(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(degrees / 45) % 8;
  return dirs[idx] ?? "—";
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

type OpenMeteoForecast = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day?: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
};

type OpenMeteoAirQuality = {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
  };
};

export async function fetchParkWeatherSnapshot(): Promise<ParkWeatherSnapshot> {
  const { lat, lng } = getParkWeatherCoordinates();
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(lat));
  forecastUrl.searchParams.set("longitude", String(lng));
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
  );
  forecastUrl.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  forecastUrl.searchParams.set("temperature_unit", "fahrenheit");
  forecastUrl.searchParams.set("wind_speed_unit", "mph");
  forecastUrl.searchParams.set("timezone", "America/Los_Angeles");

  const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airUrl.searchParams.set("latitude", String(lat));
  airUrl.searchParams.set("longitude", String(lng));
  airUrl.searchParams.set("current", "us_aqi,pm2_5");

  const [forecastRes, airRes] = await Promise.all([
    fetch(forecastUrl.toString(), { next: { revalidate: 900 } }),
    fetch(airUrl.toString(), { next: { revalidate: 900 } }),
  ]);

  if (!forecastRes.ok) {
    throw new Error(`Weather forecast unavailable (${forecastRes.status})`);
  }

  const forecast = (await forecastRes.json()) as OpenMeteoForecast;
  const currentCode = forecast.current.weather_code;

  let airQuality: ParkWeatherAirQuality = null;
  if (airRes.ok) {
    const air = (await airRes.json()) as OpenMeteoAirQuality;
    const usAqi = air.current?.us_aqi;
    if (usAqi != null && Number.isFinite(usAqi)) {
      airQuality = {
        usAqi,
        pm25: air.current?.pm2_5 ?? null,
        label: aqiLabel(usAqi),
      };
    }
  }

  const daily: ParkWeatherDaily[] = forecast.daily.time
    .slice(0, 7)
    .map((date, i) => {
      const code = forecast.daily.weather_code[i] ?? 0;
      return {
        date,
        highF: Math.round(forecast.daily.temperature_2m_max[i] ?? 0),
        lowF: Math.round(forecast.daily.temperature_2m_min[i] ?? 0),
        precipChancePercent: Math.round(
          forecast.daily.precipitation_probability_max[i] ?? 0,
        ),
        weatherLabel: weatherCodeLabel(code),
        weatherCode: code,
        moonPhase: moonPhaseForDateIso(date),
      };
    });

  return {
    locationLabel: PARK_WEATHER_LOCATION_LABEL,
    latitude: lat,
    longitude: lng,
    fetchedAt: forecast.current.time,
    current: {
      temperatureF: Math.round(forecast.current.temperature_2m),
      apparentTemperatureF: Math.round(forecast.current.apparent_temperature),
      humidityPercent: Math.round(forecast.current.relative_humidity_2m),
      windMph: Math.round(forecast.current.wind_speed_10m),
      windDirection: windDirectionLabel(forecast.current.wind_direction_10m),
      weatherLabel: weatherCodeLabel(currentCode),
      weatherCode: currentCode,
      isDay: forecast.current.is_day !== 0,
    },
    daily,
    airQuality,
  };
}
