import type { MapPositions } from "@/lib/map-positions";

/** Legacy map marker — weather now lives in the site header bar. */
export const LEGACY_PARK_WEATHER_PLACE_NAME = "Park Weather";

const EXCLUDED_MAP_PLACE_NAMES = new Set([LEGACY_PARK_WEATHER_PLACE_NAME]);

/** Strip built-in / legacy places that should not appear on the map. */
export function filterMapPlacesForDisplay(
  places: MapPositions["places"],
): MapPositions["places"] {
  const filtered = { ...places };
  for (const name of EXCLUDED_MAP_PLACE_NAMES) {
    delete filtered[name];
  }
  return filtered;
}
