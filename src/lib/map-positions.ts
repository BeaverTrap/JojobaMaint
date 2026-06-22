import * as fs from "fs";
import * as path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import bundledPositions from "../../data/map-positions.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterMapPlacesForDisplay } from "@/lib/park-system-places";
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
  /** Lot IDs hidden from map display (coordinates preserved in lots). */
  hiddenLots?: string[];
};

const MAP_FILE = path.join(process.cwd(), "data", "map-positions.json");
const MAP_COMMENT =
  "x and y are map coordinates: legacy 0-100% on schematic, or lng/lat when placed on Google Maps. Use /map/edit.";

function normalizePositions(data: Partial<MapPositions>): MapPositions {
  const hiddenLots = Array.isArray(data.hiddenLots)
    ? data.hiddenLots.filter((id) => typeof id === "string" && id.trim())
    : [];
  return {
    lots: data.lots ?? {},
    places: filterMapPlacesForDisplay(data.places ?? {}),
    valves: data.valves ?? {},
    hiddenLots,
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
      .select("lots, places, valves, hidden_lots")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const row = data as {
        lots?: MapPositions["lots"];
        places?: MapPositions["places"];
        valves?: MapPositions["valves"];
        hidden_lots?: string[];
      };
      const positions = normalizePositions({
        lots: row.lots,
        places: row.places,
        valves: row.valves,
        hiddenLots: row.hidden_lots,
      });
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
  const payload: MapPositions = {
    ...positions,
    places: filterMapPlacesForDisplay(positions.places),
  };
  const { error } = await admin.from("park_map_positions").upsert(
    {
      id: "default",
      lots: payload.lots,
      places: payload.places,
      valves: payload.valves,
      hidden_lots: payload.hiddenLots ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;

  // Keep lots.map_x/map_y in sync for numbered lots and named sites.
  const lotUpdates = Object.entries(payload.lots).map(
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
    const filePayload = { _comment: MAP_COMMENT, ...payload };
    fs.writeFileSync(MAP_FILE, JSON.stringify(filePayload, null, 2), "utf-8");
  } catch {
    // Expected on Vercel — Supabase is the source of truth in production.
  }
}
