/**
 * Custom weather condition icons — drop PNGs into public/assets/weather/icons/.
 * See public/assets/weather/icons/README.md for filenames.
 */

export type WeatherConditionIconKey =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "snow"
  | "thunderstorm";

export const WEATHER_CONDITION_ICON_DIR = "/assets/weather/icons";

export function weatherConditionIconKey(
  code: number,
  isDay = true,
): WeatherConditionIconKey {
  if (code === 0 || code === 1) {
    return isDay ? "clear-day" : "clear-night";
  }
  if (code === 2) {
    return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
  }
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "fog";
  if (code >= 71 && code <= 75) return "snow";
  if (code >= 95) return "thunderstorm";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 61 && code <= 67) return "rain";
  return "overcast";
}

export function weatherConditionIconSrc(key: WeatherConditionIconKey): string {
  return `${WEATHER_CONDITION_ICON_DIR}/${key}.png`;
}

/** All icon filenames for the README / asset checklist. */
export const WEATHER_CONDITION_ICON_KEYS: WeatherConditionIconKey[] = [
  "clear-day",
  "clear-night",
  "partly-cloudy-day",
  "partly-cloudy-night",
  "overcast",
  "fog",
  "drizzle",
  "rain",
  "showers",
  "snow",
  "thunderstorm",
];
