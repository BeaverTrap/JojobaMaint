import * as fs from "fs";
import * as path from "path";

export type MapPlacePosition = { x: number; y: number; icon?: string };

export type MapPositions = {
  lots: Record<string, { x: number; y: number }>;
  places: Record<string, MapPlacePosition>;
  valves: Record<string, { x: number; y: number }>;
};

const MAP_FILE = path.join(process.cwd(), "data", "map-positions.json");
const MAP_IMAGE = path.join(process.cwd(), "public", "images", "park_map_clean.png");

export function readMapPositions(): MapPositions {
  if (!fs.existsSync(MAP_FILE)) {
    return { lots: {}, places: {}, valves: {} };
  }
  const raw = fs.readFileSync(MAP_FILE, "utf-8");
  const data = JSON.parse(raw) as Partial<MapPositions>;
  return {
    lots: data.lots ?? {},
    places: data.places ?? {},
    valves: data.valves ?? {},
  };
}

export function mapImageVersion(): number {
  if (!fs.existsSync(MAP_IMAGE)) return 0;
  return fs.statSync(MAP_IMAGE).mtimeMs;
}
