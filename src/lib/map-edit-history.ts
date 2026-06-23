import type { MapPositions } from "@/lib/map-positions";

export type MapEditSnapshot = Pick<MapPositions, "lots" | "places" | "valves">;

export const MAP_EDIT_HISTORY_LIMIT = 50;

export function cloneMapEditSnapshot(snapshot: MapEditSnapshot): MapEditSnapshot {
  return structuredClone(snapshot);
}

export function initialMapEditSnapshot(data: MapPositions): MapEditSnapshot {
  const lots = { ...data.lots };
  for (const id of data.hiddenLots ?? []) {
    delete lots[id];
  }
  return {
    lots,
    places: data.places,
    valves: data.valves,
  };
}
