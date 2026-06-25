/** Percent-based layout for the layered weather mascot (718×512 reference). */

export type WeatherEditLayerId = "map" | "quail" | "temp";

export type WeatherLayoutRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** @deprecated Legacy anchor — converted to left/top on load. */
type LegacyQuailRect = {
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type WeatherMascotLayoutConfig = {
  width: number;
  height: number;
  map: WeatherLayoutRect;
  quail: WeatherLayoutRect;
  tempHotspot: WeatherLayoutRect;
};

/**
 * Shared layout for all users — edit on /weather/stack, then paste values here
 * and deploy.
 */
export const DEFAULT_WEATHER_MASCOT_LAYOUT: WeatherMascotLayoutConfig = {
  width: 718,
  height: 512,
  map: { left: 0, top: 3.90625, width: 100, height: 92.1875 },
  quail: {
    left: 22.061281337047358,
    top: 0,
    width: 77.24233983286908,
    height: 100,
  },
  tempHotspot: {
    left: 34.27158774373259,
    top: 40.59765625,
    width: 31.45682451253482,
    height: 18.8046875,
  },
};

export function getWeatherMascotLayout(): WeatherMascotLayoutConfig {
  return DEFAULT_WEATHER_MASCOT_LAYOUT;
}

export function rectToCss(rect: WeatherLayoutRect): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

export function normalizeQuailRect(
  quail: WeatherLayoutRect | LegacyQuailRect,
): WeatherLayoutRect {
  if ("left" in quail && typeof quail.left === "number") {
    return quail;
  }
  const legacy = quail as LegacyQuailRect;
  return {
    left: 100 - legacy.right - legacy.width,
    top: 100 - legacy.bottom - legacy.height,
    width: legacy.width,
    height: legacy.height,
  };
}

export function clampLayerRect(
  rect: WeatherLayoutRect,
  layer: "map" | "quail" | "temp",
): WeatherLayoutRect {
  const limits = {
    map: { minW: 15, minH: 15, maxW: 100, maxH: 100 },
    quail: { minW: 12, minH: 20, maxW: 100, maxH: 100 },
    temp: { minW: 8, minH: 6, maxW: 50, maxH: 40 },
  }[layer];

  const width = Math.min(limits.maxW, Math.max(limits.minW, rect.width));
  const height = Math.min(limits.maxH, Math.max(limits.minH, rect.height));
  const left = Math.min(100 - width, Math.max(0, rect.left));
  const top = Math.min(100 - height, Math.max(0, rect.top));
  return { left, top, width, height };
}

/** Paste into DEFAULT_WEATHER_MASCOT_LAYOUT in this file after tuning on /weather/stack. */
export function formatLayoutForSourceFile(
  layout: WeatherMascotLayoutConfig,
): string {
  const { map, quail, tempHotspot } = layout;
  return `export const DEFAULT_WEATHER_MASCOT_LAYOUT: WeatherMascotLayoutConfig = {
  width: 718,
  height: 512,
  map: { left: ${map.left}, top: ${map.top}, width: ${map.width}, height: ${map.height} },
  quail: { left: ${quail.left}, top: ${quail.top}, width: ${quail.width}, height: ${quail.height} },
  tempHotspot: { left: ${tempHotspot.left}, top: ${tempHotspot.top}, width: ${tempHotspot.width}, height: ${tempHotspot.height} },
};`;
}
