import { google, type sheets_v4 } from "googleapis";
import { parseServiceAccountJson } from "@/lib/calendar-config";
import { createAdminClient } from "@/lib/supabase/admin";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SYNC_STATE_ID = "default";

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_WATER_SHEET_ID?.trim();
  if (!id) throw new Error("GOOGLE_WATER_SHEET_ID is not configured");
  return id;
}

function getSheetRange(): string {
  return process.env.GOOGLE_WATER_SHEET_RANGE?.trim() || "Sheet1!A:D";
}

function getSheetsClient(): sheets_v4.Sheets {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const creds = parseServiceAccountJson(raw);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [SHEETS_SCOPE],
  });
  return google.sheets({ version: "v4", auth });
}

function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseMonth(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    if (m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, "0")}-01`;
    }
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const m = Number(slash[1]);
    const y = Number(slash[2]);
    if (m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, "0")}-01`;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = parsed.getMonth() + 1;
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }

  return null;
}

function isHeaderRow(cells: string[]): boolean {
  const first = (cells[0] ?? "").toLowerCase();
  return (
    first.includes("month") ||
    first.includes("date") ||
    first.includes("period")
  );
}

type ParsedRow = {
  period_month: string;
  gallons: number | null;
  cost_usd: number | null;
  notes: string | null;
  sheet_row_key: string;
};

function parseSheetRows(
  spreadsheetId: string,
  rows: string[][],
): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  rows.forEach((cells, index) => {
    if (index === 0 && isHeaderRow(cells)) return;
    const period = parseMonth(cells[0] ?? "");
    if (!period) return;

    parsed.push({
      period_month: period,
      gallons: parseNumber(cells[1]),
      cost_usd: parseNumber(cells[2]),
      notes: cells[3]?.trim() || null,
      sheet_row_key: `${spreadsheetId}:row:${index + 1}`,
    });
  });

  return parsed;
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getSheetRange(),
  });

  const rows = (res.data.values ?? []) as string[][];
  const records = parseSheetRows(spreadsheetId, rows);
  if (records.length === 0) {
    await saveSyncTimestamp();
    return { synced: 0 };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("water_usage_readings")
    .upsert(records, { onConflict: "sheet_row_key" });
  if (error) throw error;

  await saveSyncTimestamp();
  return { synced: records.length };
}

export function isWaterSheetConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() &&
      process.env.GOOGLE_WATER_SHEET_ID?.trim(),
  );
}
