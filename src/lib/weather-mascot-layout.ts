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
  /** Extra stage height as % of render width — room below the map for quail feet. */
  stageBottomPad?: number;
};

export type ClampLayerRectOptions = {
  /** Wider bounds for /weather/stack — layers may extend past the stage edges. */
  relaxed?: boolean;
};

/**
 * Shared layout for all users — edit on /weather/stack, then paste values here
 * and deploy.
 */
export const DEFAULT_WEATHER_MASCOT_LAYOUT: WeatherMascotLayoutConfig = {
  width: 718,
  height: 512,
  map: { left: 0, top: 0, width: 100, height: 89.6484375 },
  quail: {
    left: 40.55710306406685,
    top: -0.904977375565611,
    width: 69.44289693593315,
    height: 100,
  },
  tempHotspot: {
    left: 63.14565549465362,
    top: 9.6171875,
    width: 31.171084553868273,
    height: 18.187818156108595,
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
  options?: ClampLayerRectOptions,
): WeatherLayoutRect {
  const limits = options?.relaxed
    ? {
        map: {
          minW: 10,
          minH: 10,
          maxW: 140,
          maxH: 140,
          minL: -45,
          minT: -45,
          maxL: 110,
          maxT: 110,
        },
        quail: {
          minW: 8,
          minH: 15,
          maxW: 140,
          maxH: 140,
          minL: -45,
          minT: -45,
          maxL: 110,
          maxT: 110,
        },
        temp: {
          minW: 5,
          minH: 4,
          maxW: 60,
          maxH: 50,
          minL: -20,
          minT: -20,
          maxL: 110,
          maxT: 110,
        },
      }[layer]
    : {
        map: {
          minW: 15,
          minH: 15,
          maxW: 100,
          maxH: 100,
          minL: 0,
          minT: 0,
          maxL: 100,
          maxT: 100,
        },
        quail: {
          minW: 12,
          minH: 20,
          maxW: 100,
          maxH: 100,
          minL: 0,
          minT: 0,
          maxL: 100,
          maxT: 100,
        },
        temp: {
          minW: 8,
          minH: 6,
          maxW: 50,
          maxH: 40,
          minL: 0,
          minT: 0,
          maxL: 100,
          maxT: 100,
        },
      }[layer];

  const width = Math.min(limits.maxW, Math.max(limits.minW, rect.width));
  const height = Math.min(limits.maxH, Math.max(limits.minH, rect.height));
  const left = Math.min(limits.maxL - width, Math.max(limits.minL, rect.left));
  const top = Math.min(limits.maxT - height, Math.max(limits.minT, rect.top));
  return { left, top, width, height };
}

/** Paste into DEFAULT_WEATHER_MASCOT_LAYOUT in this file after tuning on /weather/stack. */
export function formatLayoutForSourceFile(
  layout: WeatherMascotLayoutConfig,
): string {
  const { map, quail, tempHotspot } = layout;
  const padLine =
    layout.stageBottomPad != null
      ? `,\n  stageBottomPad: ${layout.stageBottomPad}`
      : "";
  return `export const DEFAULT_WEATHER_MASCOT_LAYOUT: WeatherMascotLayoutConfig = {
  width: 718,
  height: 512,
  map: { left: ${map.left}, top: ${map.top}, width: ${map.width}, height: ${map.height} },
  quail: { left: ${quail.left}, top: ${quail.top}, width: ${quail.width}, height: ${quail.height} },
  tempHotspot: { left: ${tempHotspot.left}, top: ${tempHotspot.top}, width: ${tempHotspot.width}, height: ${tempHotspot.height} }${padLine}
};`;
}
