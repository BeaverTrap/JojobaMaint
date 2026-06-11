import { google, type sheets_v4 } from "googleapis";
import {
  getServiceAccountCredentials,
  hasServiceAccountCredentials,
} from "@/lib/calendar-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { lotToSlug } from "@/lib/lot-slug";
import { readMapPositions } from "@/lib/map-positions";

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
};

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

function parseCrossConnection(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (["yes", "y", "true", "1", "x", "has", "installed"].includes(v)) return true;
  if (["no", "n", "false", "0", "none", "na", "n/a"].includes(v)) return false;
  return null;
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

async function fetchOptionalLotSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<Record<string, string>[]> {
  try {
    const values = await fetchSheetValues(sheets, spreadsheetId, "Lot Sheet");
    return toObjects(values);
  } catch {
    return [];
  }
}

function ensureLotDraft(
  map: Map<string, LotDraft>,
  lotNumber: string,
  positions: ReturnType<typeof readMapPositions>,
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
    });
  }
  return map.get(key)!;
}

export async function syncLotsFromSheet(): Promise<{ synced: number }> {
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const { zoneRows } = await getValveData();
  const lotSheetRows = await fetchOptionalLotSheet(sheets, spreadsheetId);
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
    const lotNumber = findColumn(row, ["Lot #", "Lot", "Site", "Site #"]).trim();
    if (!lotNumber) continue;
    const draft = ensureLotDraft(lotMap, lotNumber, positions);
    const unitId = findColumn(row, ["Unit ID", "Unit Id", "UnitID", "Unit"]);
    const cross = findColumn(row, [
      "Cross Connection",
      "Cross-connection",
      "Cross Conn",
      "CC",
    ]);
    const notes = findColumn(row, ["Notes", "Sheet Notes", "Comments"]);
    if (unitId) draft.unit_id = unitId;
    if (cross) draft.has_cross_connection = parseCrossConnection(cross);
    if (notes) draft.sheet_notes = notes;
  }

  for (const lotNumber of Object.keys(positions.lots)) {
    ensureLotDraft(lotMap, lotNumber, positions);
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

export function isValveSheetConfigured(): boolean {
  return Boolean(
    hasServiceAccountCredentials() &&
      (process.env.GOOGLE_VALVE_SHEET_ID?.trim() ||
        process.env.GOOGLE_SHEETS_ID?.trim()),
  );
}
