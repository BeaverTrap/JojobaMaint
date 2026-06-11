import { google, type sheets_v4 } from "googleapis";
import {
  getServiceAccountCredentials,
  hasServiceAccountCredentials,
} from "@/lib/calendar-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { lotToSlug } from "@/lib/lot-slug";
import { readMapPositions, type MapPlacePosition } from "@/lib/map-positions";
import { PLACE_ICON_DEFAULTS } from "@/lib/map-place-icons";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SYNC_STATE_ID = "default";

export type ValveRecord = {
  valveId: string;
  location: string;
  locationNotes: string;
  function: string;
  zones: string[];
  lots: string[];
};

type LotDraft = {
  lot_number: string;
  slug: string;
  zones: Set<string>;
  valves: Set<string>;
  unit_id: string | null;
  has_cross_connection: boolean | null;
  sheet_notes: string | null;
  map_x: number | null;
  map_y: number | null;
  location_type: "lot" | "site" | "amenity";
  place_icon: string | null;
};

function inferLocationType(name: string): "lot" | "site" {
  return /^\d+$/.test(name.trim()) ? "lot" : "site";
}

let valveCache: { data: ValveRecord[]; zoneRows: Record<string, string>[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

function getSpreadsheetId(): string {
  const id =
    process.env.GOOGLE_VALVE_SHEET_ID?.trim() ||
    process.env.GOOGLE_SHEETS_ID?.trim();
  if (!id) throw new Error("GOOGLE_VALVE_SHEET_ID is not configured");
  return id;
}

function getSheetsClient(): sheets_v4.Sheets {
  const creds = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [SHEETS_SCOPE],
  });
  return google.sheets({ version: "v4", auth });
}

function quoteSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

async function fetchSheetValues(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetTitle(sheetName)}!A:Z`,
  });
  return (res.data.values ?? []) as string[][];
}

function toObjects(values: string[][]): Record<string, string>[] {
  if (values.length === 0) return [];
  const headers = values[0].map((h) => h.trim());
  return values.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index]?.trim() ?? "";
    });
    return obj;
  });
}

/** CCCP = cross-connection control program installation at the lot. */
function parseCrossConnection(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (
    ["yes", "y", "true", "1", "x", "has", "installed", "cccp", "active"].includes(v)
  ) {
    return true;
  }
  if (["no", "n", "false", "0", "none", "na", "n/a", "not installed"].includes(v)) {
    return false;
  }
  return null;
}

const CROSS_CONNECTION_SHEET_TABS = [
  "CCCP Installation",
  "CCCP",
  "Lot Sheet",
  "Cross Connection",
] as const;

function applyCrossConnectionRow(
  draft: LotDraft,
  row: Record<string, string>,
): void {
  const unitId = findColumn(row, [
    "Unit ID",
    "Unit Id",
    "UnitID",
    "Unit",
    "Unit #",
    "CCCP Unit ID",
    "Device ID",
    "Device Id",
  ]);
  const cross = findColumn(row, [
    "Cross Connection",
    "Cross-connection",
    "Cross Conn",
    "CCCP",
    "CCCP Installation",
    "Has Cross Connection",
    "Has CCCP",
    "CC",
  ]);
  const notes = findColumn(row, ["Notes", "Sheet Notes", "Comments", "CCCP Notes"]);
  if (unitId) draft.unit_id = unitId;
  if (cross) draft.has_cross_connection = parseCrossConnection(cross);
  if (notes) draft.sheet_notes = notes;
}

function findColumn(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
    const key = Object.keys(row).find(
      (k) => k.toLowerCase() === name.toLowerCase(),
    );
    if (key) return row[key] ?? "";
  }
  return "";
}

async function fetchAndJoinValves(): Promise<{
  valves: ValveRecord[];
  zoneRows: Record<string, string>[];
}> {
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const [valveValues, zoneValues] = await Promise.all([
    fetchSheetValues(sheets, spreadsheetId, "Valve Sheet"),
    fetchSheetValues(sheets, spreadsheetId, "Zone Sheet"),
  ]);

  if (valveValues.length === 0) throw new Error("Valve Sheet is empty");

  const valveObjects = toObjects(valveValues);
  const zoneObjects = toObjects(zoneValues);

  const valveZoneMap = new Map<string, { zones: Set<string>; lots: Set<string> }>();
  for (const zoneRow of zoneObjects) {
    const valveId = zoneRow["Valve"]?.trim();
    if (!valveId) continue;
    const valveExists = valveObjects.some((v) => v["Valve"]?.trim() === valveId);
    if (!valveExists) continue;
    if (!valveZoneMap.has(valveId)) {
      valveZoneMap.set(valveId, { zones: new Set(), lots: new Set() });
    }
    const entry = valveZoneMap.get(valveId)!;
    if (zoneRow["Zone"]) entry.zones.add(zoneRow["Zone"].trim());
    if (zoneRow["Lot #"]) entry.lots.add(zoneRow["Lot #"].trim());
  }

  const valves: ValveRecord[] = valveObjects.map((valve) => {
    const valveId = valve["Valve"]?.trim() || "";
    const zoneEntry = valveZoneMap.get(valveId) ?? {
      zones: new Set<string>(),
      lots: new Set<string>(),
    };
    return {
      valveId,
      location: valve["Location"]?.trim() || "",
      locationNotes: valve["Location Notes"]?.trim() || "",
      function: valve["Function"]?.trim() || "",
      zones: Array.from(zoneEntry.zones).sort(),
      lots: Array.from(zoneEntry.lots).sort(),
    };
  });

  return { valves, zoneRows: zoneObjects };
}

export async function getValveData(): Promise<{
  data: ValveRecord[];
  zoneRows: Record<string, string>[];
  updatedAt: number;
  stale: boolean;
}> {
  const now = Date.now();
  if (valveCache && now - valveCache.fetchedAt < CACHE_TTL_MS) {
    return {
      data: valveCache.data,
      zoneRows: valveCache.zoneRows,
      updatedAt: valveCache.fetchedAt,
      stale: false,
    };
  }

  const { valves, zoneRows } = await fetchAndJoinValves();
  valveCache = { data: valves, zoneRows, fetchedAt: now };
  return { data: valves, zoneRows, updatedAt: now, stale: false };
}

export function clearValveCache(): void {
  valveCache = null;
}

export async function getZonesForLot(lotNumber: string): Promise<string[]> {
  const { zoneRows } = await getValveData();
  const zones = new Set<string>();
  for (const row of zoneRows) {
    const lot = row["Lot #"]?.trim();
    const zone = row["Zone"]?.trim();
    if (lot && zone && lot.toLowerCase() === lotNumber.toLowerCase()) {
      zones.add(zone);
    }
  }
  return Array.from(zones).sort();
}

export async function getLotsForZone(zoneName: string): Promise<string[]> {
  const { zoneRows } = await getValveData();
  const lots = new Set<string>();
  for (const row of zoneRows) {
    const lot = row["Lot #"]?.trim();
    const zone = row["Zone"]?.trim();
    if (lot && zone && zone.toLowerCase() === zoneName.toLowerCase()) {
      lots.add(lot);
    }
  }
  return Array.from(lots).sort();
}

export async function getValvesForZone(zoneName: string): Promise<string[]> {
  const { zoneRows } = await getValveData();
  const valveIds = new Set<string>();
  for (const row of zoneRows) {
    const valve = row["Valve"]?.trim();
    const zone = row["Zone"]?.trim();
    if (valve && zone && zone.toLowerCase() === zoneName.toLowerCase()) {
      valveIds.add(valve);
    }
  }
  return Array.from(valveIds).sort();
}

export async function getValveById(valveId: string): Promise<ValveRecord | null> {
  const { data } = await getValveData();
  const normalized = valveId.trim().toLowerCase();
  return (
    data.find((v) => v.valveId.trim().toLowerCase() === normalized) ?? null
  );
}

/** Boss-maintained CCCP / cross-connection tabs (optional). All matching tabs are merged. */
async function fetchCrossConnectionSheetRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];

  for (const tabName of CROSS_CONNECTION_SHEET_TABS) {
    try {
      const values = await fetchSheetValues(sheets, spreadsheetId, tabName);
      rows.push(...toObjects(values));
    } catch {
      // Tab missing or unreadable — try next name
    }
  }

  return rows;
}

function ensureLotDraft(
  map: Map<string, LotDraft>,
  lotNumber: string,
  positions: ReturnType<typeof readMapPositions>,
  locationType: "lot" | "site" | "amenity" = "lot",
  placeIcon: string | null = null,
): LotDraft {
  const key = lotNumber.trim();
  if (!map.has(key)) {
    const pos = positions.lots[key];
    map.set(key, {
      lot_number: key,
      slug: lotToSlug(key),
      zones: new Set(),
      valves: new Set(),
      unit_id: null,
      has_cross_connection: null,
      sheet_notes: null,
      map_x: pos?.x ?? null,
      map_y: pos?.y ?? null,
      location_type: locationType,
      place_icon: placeIcon,
    });
  }
  return map.get(key)!;
}

function ensureAmenityDraft(
  map: Map<string, LotDraft>,
  name: string,
  pos: MapPlacePosition,
): LotDraft {
  const key = name.trim();
  if (!map.has(key)) {
    map.set(key, {
      lot_number: key,
      slug: lotToSlug(key),
      zones: new Set(),
      valves: new Set(),
      unit_id: null,
      has_cross_connection: null,
      sheet_notes: null,
      map_x: pos.x,
      map_y: pos.y,
      location_type: "amenity",
      place_icon: pos.icon ?? PLACE_ICON_DEFAULTS[name] ?? null,
    });
  }
  return map.get(key)!;
}

export async function syncLotsFromSheet(): Promise<{ synced: number }> {
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const { zoneRows } = await getValveData();
  const lotSheetRows = await fetchCrossConnectionSheetRows(sheets, spreadsheetId);
  const positions = readMapPositions();
  const lotMap = new Map<string, LotDraft>();

  for (const row of zoneRows) {
    const lotNumber = row["Lot #"]?.trim();
    if (!lotNumber) continue;
    const draft = ensureLotDraft(lotMap, lotNumber, positions);
    const zone = row["Zone"]?.trim();
    const valve = row["Valve"]?.trim();
    if (zone) draft.zones.add(zone);
    if (valve) draft.valves.add(valve);
  }

  for (const row of lotSheetRows) {
    const lotNumber = findColumn(row, [
      "Lot #",
      "Lot",
      "Site",
      "Site #",
      "Lot Number",
    ]).trim();
    if (!lotNumber) continue;
    const draft = ensureLotDraft(lotMap, lotNumber, positions);
    applyCrossConnectionRow(draft, row);
  }

  for (const lotNumber of Object.keys(positions.lots)) {
    ensureLotDraft(
      lotMap,
      lotNumber,
      positions,
      inferLocationType(lotNumber),
    );
  }

  for (const [placeName, pos] of Object.entries(positions.places)) {
    ensureAmenityDraft(lotMap, placeName, pos);
  }

  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data: existingRows } = await supabase
    .from("lots")
    .select("lot_number, staff_notes");
  const staffNotesByLot = new Map(
    (existingRows ?? []).map((row) => [
      row.lot_number as string,
      (row.staff_notes as string | null) ?? null,
    ]),
  );

  const rows = Array.from(lotMap.values()).map((draft) => ({
    lot_number: draft.lot_number,
    slug: draft.slug,
    zones: Array.from(draft.zones).sort(),
    valves: Array.from(draft.valves).sort(),
    unit_id: draft.unit_id,
    has_cross_connection: draft.has_cross_connection,
    sheet_notes: draft.sheet_notes,
    staff_notes: staffNotesByLot.get(draft.lot_number) ?? null,
    map_x: draft.map_x,
    map_y: draft.map_y,
    location_type: draft.location_type,
    place_icon: draft.place_icon,
    sheet_synced_at: now,
  }));

  const { error } = await supabase.from("lots").upsert(rows, {
    onConflict: "lot_number",
  });
  if (error) throw error;

  await supabase
    .from("lots_sync_state")
    .update({ last_synced_at: now, updated_at: now })
    .eq("id", SYNC_STATE_ID);

  clearValveCache();
  return { synced: rows.length };
}

/** Refresh valve/lot/zone data from the sheet into Supabase (same as lots sync). */
export async function syncParkDataFromSheet(): Promise<{
  synced: number;
  valveCount: number;
  lotsMissingMapPosition: number;
}> {
  const positions = readMapPositions();
  const { synced } = await syncLotsFromSheet();
  const { data: valves } = await getValveData();

  const sheetLots = new Set<string>();
  for (const valve of valves) {
    for (const lot of valve.lots) sheetLots.add(lot);
  }
  let lotsMissingMapPosition = 0;
  for (const lot of sheetLots) {
    if (!positions.lots[lot]) lotsMissingMapPosition += 1;
  }

  return { synced, valveCount: valves.length, lotsMissingMapPosition };
}

export function isValveSheetConfigured(): boolean {
  return Boolean(
    hasServiceAccountCredentials() &&
      (process.env.GOOGLE_VALVE_SHEET_ID?.trim() ||
        process.env.GOOGLE_SHEETS_ID?.trim()),
  );
}
