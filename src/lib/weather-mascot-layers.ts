/** Layered weather mascot — map + live temp hotspot + quail sets (see public/assets/mascot/weather/). */

import { WEATHER_LAYER_BASE } from "@/lib/weather-mascot-layout-constants";

export type WeatherMapVariant =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "fog"
  | "snow";

export type WeatherQuailSet = "regular" | "hot" | "cold" | "rain";

export const WEATHER_MASCOT_COMPOSITE = "/assets/mascot/weather.png";

/** °F — at or above uses the hot quail set. */
export const WEATHER_HOT_TEMP_F = 88;

/** °F — at or below uses the cold quail set. */
export const WEATHER_COLD_TEMP_F = 58;

const QUAIL_REGULAR = [
  "quail_001.png",
  "quail_002.png",
  "quail_003.png",
  "quail_004.png",
  "quail_005.png",
  "quail_006.png",
] as const;

const QUAIL_HOT = [
  "quail_Hot_001.png",
  "quail_Hot_002.png",
  "quail_Hot_003.png",
] as const;

const QUAIL_COLD = [
  "quail_cold_001.png",
  "quail_cold_002.png",
  "quail_cold_003.png",
] as const;

const QUAIL_RAIN = [
  "quail_rain_001.png",
  "quail_rain_002.png",
  "quail_rain_003.png",
] as const;

const QUAIL_SET_FILES: Record<WeatherQuailSet, readonly string[]> = {
  regular: QUAIL_REGULAR,
  hot: QUAIL_HOT,
  cold: QUAIL_COLD,
  rain: QUAIL_RAIN,
};

export const WEATHER_MAP_CATALOG: {
  variant: WeatherMapVariant;
  label: string;
}[] = [
  { variant: "clear", label: "Sunny" },
  { variant: "cloudy", label: "Cloudy" },
  { variant: "rain", label: "Rain" },
  { variant: "storm", label: "Storm" },
  { variant: "fog", label: "Fog" },
  { variant: "snow", label: "Snow" },
];

export type WeatherQuailCatalogEntry = {
  set: WeatherQuailSet;
  file: string;
  src: string;
  label: string;
};

const QUAIL_SET_ORDER: WeatherQuailSet[] = [
  "regular",
  "hot",
  "cold",
  "rain",
];

export function getWeatherQuailCatalog(): WeatherQuailCatalogEntry[] {
  const entries: WeatherQuailCatalogEntry[] = [];
  for (const set of QUAIL_SET_ORDER) {
    for (const file of QUAIL_SET_FILES[set]) {
      entries.push({
        set,
        file,
        src: `${WEATHER_LAYER_BASE}/${file}`,
        label: `${quailSetLabel(set)} · ${file.replace(/\.png$/i, "")}`,
      });
    }
  }
  return entries;
}

export const WEATHER_QUAIL_CATALOG = getWeatherQuailCatalog();

export function weatherCodeToMapVariant(code: number): WeatherMapVariant {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "fog";
  if (code >= 71 && code <= 75) return "snow";
  if (code >= 95) return "storm";
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return "rain";
  }
  return "cloudy";
}

export function isRainyWeatherCode(code: number): boolean {
  const variant = weatherCodeToMapVariant(code);
  return variant === "rain" || variant === "storm";
}

export function resolveQuailSet(
  temperatureF: number,
  weatherCode: number,
): WeatherQuailSet {
  if (isRainyWeatherCode(weatherCode)) return "rain";
  if (temperatureF >= WEATHER_HOT_TEMP_F) return "hot";
  if (temperatureF <= WEATHER_COLD_TEMP_F) return "cold";
  return "regular";
}

/** Stable pick within a set — changes when the weather refresh seed changes. */
export function rotationIndex(seed: string, count: number): number {
  if (count <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

export function mapAssetPath(variant: WeatherMapVariant): string {
  const file =
    variant === "clear" ? "map-sunny.png" : `map-${variant}.png`;
  return `${WEATHER_LAYER_BASE}/${file}`;
}

export function mapSrcFallbackChain(variant: WeatherMapVariant): string[] {
  const chain: string[] = [mapAssetPath(variant)];
  if (variant !== "clear") {
    chain.push(mapAssetPath("clear"));
  }
  return chain;
}

export function quailSrcForSet(
  set: WeatherQuailSet,
  rotationSeed: string,
): string {
  const files = QUAIL_SET_FILES[set];
  const idx = rotationIndex(rotationSeed, files.length);
  return `${WEATHER_LAYER_BASE}/${files[idx]}`;
}

export function quailSrcFallbackChain(
  set: WeatherQuailSet,
  rotationSeed: string,
): string[] {
  const files = QUAIL_SET_FILES[set];
  const primary = rotationIndex(rotationSeed, files.length);
  const chain: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const idx = (primary + i) % files.length;
    chain.push(`${WEATHER_LAYER_BASE}/${files[idx]}`);
  }
  chain.push(`${WEATHER_LAYER_BASE}/${QUAIL_REGULAR[0]}`);
  chain.push(WEATHER_MASCOT_COMPOSITE);
  return chain;
}

/** Short label for the map temp chip (fits the hotspot). */
export function weatherOverlayShortLabel(code: number, label: string): string {
  if (code === 0 || code === 1) return "Sunny";
  if (code === 2 || code === 3) return "Cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 71 && code <= 75) return "Snow";
  if (code >= 95) return "Storm";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 80 && code <= 82) return "Showers";
  const first = label.split(" ")[0];
  return first ?? label;
}

export function quailSetLabel(set: WeatherQuailSet): string {
  switch (set) {
    case "regular":
      return "Regular";
    case "hot":
      return "Hot";
    case "cold":
      return "Cold";
    case "rain":
      return "Rain";
    default: {
      const _exhaustive: never = set;
      return _exhaustive;
    }
  }
}
