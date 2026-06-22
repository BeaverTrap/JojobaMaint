import type { MapPlacePosition, MapPositions } from "@/lib/map-positions";

/** Reserved map marker — tap to open live weather & area conditions. */
export const PARK_WEATHER_PLACE_NAME = "Park Weather";

const SYSTEM_PLACE_NAMES = new Set([PARK_WEATHER_PLACE_NAME]);

/** Default position near park center (editable in /map/edit). */
export const DEFAULT_PARK_WEATHER_PLACE: MapPlacePosition = {
  x: 50,
  y: 48,
  icon: "MdWbSunny",
  color: "sky",
};

export function isSystemMapPlace(name: string): boolean {
  return SYSTEM_PLACE_NAMES.has(name);
}

export function isParkWeatherPlace(name: string): boolean {
  return name === PARK_WEATHER_PLACE_NAME;
}

/** Ensures built-in informational markers exist without overwriting saved positions. */
export function mergeSystemMapPlaces(
  places: MapPositions["places"],
): MapPositions["places"] {
  if (places[PARK_WEATHER_PLACE_NAME]) {
    return places;
  }
  return {
    ...places,
    [PARK_WEATHER_PLACE_NAME]: DEFAULT_PARK_WEATHER_PLACE,
  };
}
