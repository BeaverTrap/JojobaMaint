import * as fs from "fs";
import * as path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import bundledPositions from "../../data/map-positions.json";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaceMarkerColor } from "@/lib/map-place-icons";

export type MapPlacePosition = {
  x?: number;
  y?: number;
  icon?: string;
  color?: PlaceMarkerColor;
};

export type MapPositions = {
  lots: Record<string, { x: number; y: number }>;
  places: Record<string, MapPlacePosition>;
  valves: Record<string, { x: number; y: number }>;
};

const MAP_FILE = path.join(process.cwd(), "data", "map-positions.json");
const MAP_COMMENT =
  "x and y are map coordinates: legacy 0-100% on schematic, or lng/lat when placed on Google Maps. Use /map/edit.";

function normalizePositions(data: Partial<MapPositions>): MapPositions {
  return {
    lots: data.lots ?? {},
    places: data.places ?? {},
    valves: data.valves ?? {},
  };
}

/** Bundled at build time — fallback when DB has no overrides. */
export function readMapPositions(): MapPositions {
  return normalizePositions(bundledPositions as Partial<MapPositions>);
}

export function mapImageVersion(): number {
  const imagePath = path.join(
    process.cwd(),
    "public",
    "images",
    "park_map_clean.png",
  );
  if (!fs.existsSync(imagePath)) return 0;
  return fs.statSync(imagePath).mtimeMs;
}

/** Prefer Supabase overrides; fall back to bundled JSON. */
export async function fetchMapPositions(
  supabase?: SupabaseClient,
): Promise<MapPositions> {
  if (supabase) {
    const { data, error } = await supabase
      .from("park_map_positions")
      .select("lots, places, valves")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const positions = normalizePositions(data as Partial<MapPositions>);
      const hasData =
        Object.keys(positions.lots).length > 0 ||
        Object.keys(positions.places).length > 0 ||
        Object.keys(positions.valves).length > 0;
      if (hasData) return positions;
    }
  }

  return readMapPositions();
}

export async function saveMapPositions(positions: MapPositions): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("park_map_positions").upsert(
    {
      id: "default",
      lots: positions.lots,
      places: positions.places,
      valves: positions.valves,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;

  // Keep lots.map_x/map_y in sync for numbered lots and named sites.
  const lotUpdates = Object.entries(positions.lots).map(
    ([lotNumber, pos]) => ({
      lot_number: lotNumber,
      map_x: pos.x,
      map_y: pos.y,
    }),
  );
  for (const row of lotUpdates) {
    await admin
      .from("lots")
      .update({ map_x: row.map_x, map_y: row.map_y })
      .eq("lot_number", row.lot_number);
  }

  // Local dev: also write JSON when the data directory is writable.
  try {
    const dir = path.dirname(MAP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = { _comment: MAP_COMMENT, ...positions };
    fs.writeFileSync(MAP_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {
    // Expected on Vercel — Supabase is the source of truth in production.
  }
}
