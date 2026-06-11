import { google, type sheets_v4 } from "googleapis";
import {
  getServiceAccountCredentials,
  hasServiceAccountCredentials,
} from "@/lib/calendar-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUsageCalculationsRows } from "@/lib/water-sheet-parse";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SYNC_STATE_ID = "default";
const USAGE_CALCULATIONS_TAB = "Usage Calculations";

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_WATER_SHEET_ID?.trim();
  if (!id) throw new Error("GOOGLE_WATER_SHEET_ID is not configured");
  return id;
}

function quoteSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

async function getWaterSheetRange(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<string> {
  const explicit = process.env.GOOGLE_WATER_SHEET_RANGE?.trim();
  if (explicit) return explicit;

  const gid = process.env.GOOGLE_WATER_SHEET_GID?.trim();
  if (gid) {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties",
    });
    const sheet = meta.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === gid,
    );
    const title = sheet?.properties?.title;
    if (!title) {
      throw new Error(
        `No sheet tab found for GOOGLE_WATER_SHEET_GID=${gid}. Check the gid in the sheet URL.`,
      );
    }
    return `${quoteSheetTitle(title)}!A:Z`;
  }

  return `${quoteSheetTitle(USAGE_CALCULATIONS_TAB)}!A:Z`;
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

export function parseWaterSheetRows(
  spreadsheetId: string,
  rows: unknown[][],
) {
  return parseUsageCalculationsRows(spreadsheetId, rows);
}

async function saveSyncTimestamp() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("water_usage_sync_state")
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", SYNC_STATE_ID);
  if (error) throw error;
}

export async function syncWaterUsageFromSheet(): Promise<{ synced: number }> {
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const range = await getWaterSheetRange(sheets, spreadsheetId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = (res.data.values ?? []) as unknown[][];
  const records = parseWaterSheetRows(spreadsheetId, rows);
  if (records.length === 0) {
    await saveSyncTimestamp();
    return { synced: 0 };
  }

  const supabase = createAdminClient();
  const periods = records.map((r) => r.period_month);

  // Remove legacy parser rows and replace months we are about to upsert.
  await supabase
    .from("water_usage_readings")
    .delete()
    .like("sheet_row_key", "%:compare:%");
  if (periods.length > 0) {
    const { error: replaceError } = await supabase
      .from("water_usage_readings")
      .delete()
      .in("period_month", periods);
    if (replaceError) throw replaceError;
  }

  const { error } = await supabase.from("water_usage_readings").insert(records);
  if (error) throw error;

  const { data: existing } = await supabase
    .from("water_usage_readings")
    .select("period_month");
  const stalePeriods = (existing ?? [])
    .map((row) => row.period_month as string)
    .filter((period) => !periods.includes(period));
  if (stalePeriods.length > 0) {
    const { error: deleteError } = await supabase
      .from("water_usage_readings")
      .delete()
      .in("period_month", stalePeriods);
    if (deleteError) throw deleteError;
  }

  await saveSyncTimestamp();
  return { synced: records.length };
}

export function isWaterSheetConfigured(): boolean {
  return Boolean(
    hasServiceAccountCredentials() &&
      process.env.GOOGLE_WATER_SHEET_ID?.trim(),
  );
}
