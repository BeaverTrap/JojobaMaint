import { google, type sheets_v4 } from "googleapis";
import { parseServiceAccountJson } from "@/lib/calendar-config";
import { createAdminClient } from "@/lib/supabase/admin";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SYNC_STATE_ID = "default";

const MONTH_ABBR: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_WATER_SHEET_ID?.trim();
  if (!id) throw new Error("GOOGLE_WATER_SHEET_ID is not configured");
  return id;
}

function quoteSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

async function getSheetRange(
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
    // Usage Calculations layout needs columns through the year-over-year table.
    return `${quoteSheetTitle(title)}!A:AT`;
  }

  return "Sheet1!A:D";
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

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseNumber(value: unknown): number | null {
  const raw = cellString(value);
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
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

  const slashFull = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashFull) {
    const m = Number(slashFull[1]);
    const y = Number(slashFull[3]);
    if (m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, "0")}-01`;
    }
  }

  const monthNum = MONTH_ABBR[trimmed];
  if (monthNum) {
    const year = new Date().getFullYear();
    return `${year}-${String(monthNum).padStart(2, "0")}-01`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = parsed.getMonth() + 1;
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }

  return null;
}

function periodFromMonthYear(monthName: string, year: number): string | null {
  const monthNum = MONTH_ABBR[monthName];
  if (!monthNum) return null;
  return `${year}-${String(monthNum).padStart(2, "0")}-01`;
}

type ParsedRow = {
  period_month: string;
  gallons: number | null;
  cost_usd: number | null;
  notes: string | null;
  sheet_row_key: string;
};

type ComparisonHeader = {
  headerRow: number;
  monthCol: number;
  yearCols: { year: number; col: number }[];
};

function findComparisonHeader(rows: unknown[][]): ComparisonHeader | null {
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r] ?? [];
    let monthCol = -1;
    const yearCols: { year: number; col: number }[] = [];

    row.forEach((cell, c) => {
      const v = cellString(cell);
      if (v === "Month") monthCol = c;
      if (/^20\d{2}$/.test(v)) yearCols.push({ year: Number(v), col: c });
    });

    if (monthCol >= 0 && yearCols.length > 0) {
      return { headerRow: r, monthCol, yearCols };
    }
  }
  return null;
}

/** Jojoba water workbook: "Usage Calculations" year-over-year table (Month / 2025 / 2026). */
function parseComparisonTable(
  spreadsheetId: string,
  rows: unknown[][],
  header: ComparisonHeader,
): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  for (let r = header.headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const monthName = cellString(row[header.monthCol]);
    if (!monthName || !MONTH_ABBR[monthName]) break;

    for (const { year, col } of header.yearCols) {
      const gallons = parseNumber(row[col]);
      if (gallons == null) continue;

      const period = periodFromMonthYear(monthName, year);
      if (!period) continue;

      parsed.push({
        period_month: period,
        gallons,
        cost_usd: null,
        notes: `${year} monthly total`,
        sheet_row_key: `${spreadsheetId}:compare:${year}:${monthName}`,
      });
    }
  }

  return parsed;
}

function isSimpleHeaderRow(cells: unknown[]): boolean {
  const first = cellString(cells[0]).toLowerCase();
  return (
    first.includes("month") ||
    first.includes("date") ||
    first.includes("period")
  );
}

/** Fallback: column A = month, B = gallons, C = cost, D = notes. */
function parseSimpleRows(
  spreadsheetId: string,
  rows: unknown[][],
): ParsedRow[] {
  const parsed: ParsedRow[] = [];

  rows.forEach((cells, index) => {
    if (index === 0 && isSimpleHeaderRow(cells)) return;
    const period = parseMonth(cellString(cells[0]));
    if (!period) return;

    parsed.push({
      period_month: period,
      gallons: parseNumber(cells[1]),
      cost_usd: parseNumber(cells[2]),
      notes: cellString(cells[3]) || null,
      sheet_row_key: `${spreadsheetId}:simple:row:${index + 1}`,
    });
  });

  return parsed;
}

export function parseWaterSheetRows(
  spreadsheetId: string,
  rows: unknown[][],
): ParsedRow[] {
  const comparison = findComparisonHeader(rows);
  if (comparison) {
    const fromComparison = parseComparisonTable(
      spreadsheetId,
      rows,
      comparison,
    );
    if (fromComparison.length > 0) return fromComparison;
  }
  return parseSimpleRows(spreadsheetId, rows);
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
  const range = await getSheetRange(sheets, spreadsheetId);
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
