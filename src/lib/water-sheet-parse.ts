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

/** Usage Calculations column indices (row with DATE header). */
export const USAGE_CALC_COL = {
  date: 0,
  twoTankGallons: 2,
  oakGroveGallons: 7,
  totalGallons: 10,
  rigsGallons: 12,
  irrigationGallons: 14,
  pondsGallons: 16,
} as const;

export type WaterMonthlyRow = {
  period_month: string;
  gallons: number;
  oak_grove_gallons: number | null;
  two_tank_gallons: number | null;
  rigs_facilities_gallons: number | null;
  ponds_gallons: number | null;
  irrigation_leaks_gallons: number | null;
  sheet_row_key: string;
};

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseNumber(value: unknown): number | null {
  const raw = cellString(value);
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s%]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parses sheet dates like "May , 26" or "Jan , 24". */
export function parseUsageCalculationsDate(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^([A-Za-z]{3,9})\s*,\s*(\d{2,4})$/);
  if (!match) return null;

  const monthKey =
    Object.keys(MONTH_ABBR).find(
      (k) => k.toLowerCase() === match[1].slice(0, 3).toLowerCase(),
    ) ?? null;
  if (!monthKey) return null;

  let year = Number(match[2]);
  if (year < 100) year += 2000;

  const month = MONTH_ABBR[monthKey];
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function findUsageCalculationsHeaderRow(rows: unknown[][]): number {
  for (let r = 0; r < Math.min(rows.length, 8); r++) {
    if (cellString(rows[r]?.[0]).toUpperCase() === "DATE") return r;
  }
  return -1;
}

/** Parse Usage Calculations meter rows (source for Monthly Report). */
export function parseUsageCalculationsRows(
  spreadsheetId: string,
  rows: unknown[][],
): WaterMonthlyRow[] {
  const headerRow = findUsageCalculationsHeaderRow(rows);
  if (headerRow < 0) return [];

  const parsed: WaterMonthlyRow[] = [];

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const period = parseUsageCalculationsDate(cellString(row[USAGE_CALC_COL.date]));
    if (!period) continue;

    const total = parseNumber(row[USAGE_CALC_COL.totalGallons]);
    if (total == null || total <= 0) continue;

    const oakGrove = parseNumber(row[USAGE_CALC_COL.oakGroveGallons]);
    const twoTank = parseNumber(row[USAGE_CALC_COL.twoTankGallons]);
    // Skip template/placeholder rows (e.g. future months with a formula total only).
    if ((oakGrove ?? 0) <= 0 && (twoTank ?? 0) <= 0) continue;

    parsed.push({
      period_month: period,
      gallons: total,
      oak_grove_gallons: oakGrove,
      two_tank_gallons: twoTank,
      rigs_facilities_gallons: parseNumber(row[USAGE_CALC_COL.rigsGallons]),
      ponds_gallons: parseNumber(row[USAGE_CALC_COL.pondsGallons]),
      irrigation_leaks_gallons: parseNumber(
        row[USAGE_CALC_COL.irrigationGallons],
      ),
      sheet_row_key: `${spreadsheetId}:usage:${period}`,
    });
  }

  return parsed;
}
