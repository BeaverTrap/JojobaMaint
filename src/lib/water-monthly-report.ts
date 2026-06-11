import type { WaterUsageReading } from "@/lib/database.types";
import {
  daysInPeriodMonth,
  formatGallons,
  formatWaterMonth,
  formatWaterMonthLong,
} from "@/lib/water-usage";

function pct(part: number | null, total: number | null): string {
  if (part == null || total == null || total <= 0) return "—";
  return `${((part / total) * 100).toFixed(1)}%`;
}

/** Same bullet copy as the Monthly Report tab on the water workbook. */
export function buildMonthlyReportBullets(
  reading: WaterUsageReading,
): string[] {
  const total = reading.gallons ?? 0;
  const oak = reading.oak_grove_gallons;
  const twoTank = reading.two_tank_gallons;
  const rigs = reading.rigs_facilities_gallons;
  const ponds = reading.ponds_gallons;
  const irrigation = reading.irrigation_leaks_gallons;
  const days = daysInPeriodMonth(reading.period_month);
  const dailyAvg =
    total > 0 && days > 0 ? Math.round(total / days) : null;

  const bullets: string[] = [
    `Total usage was ${formatGallons(total)} gallons.`,
  ];

  if (oak != null) {
    bullets.push(
      `Oak Grove pumped ${formatGallons(oak)} gallons (${pct(oak, total)} of the total).`,
    );
  }
  if (twoTank != null) {
    bullets.push(
      `Two Tank pumped ${formatGallons(twoTank)} gallons (${pct(twoTank, total)} of the total).`,
    );
  }
  if (dailyAvg != null) {
    bullets.push(`Average daily use was ${formatGallons(dailyAvg)} gallons.`);
  }
  if (rigs != null) {
    bullets.push(
      `${pct(rigs, total)} was used by rigs and facilities (${formatGallons(rigs)} gallons).`,
    );
  }
  if (ponds != null) {
    bullets.push(
      `${pct(ponds, total)} was used to fill the ponds (${formatGallons(ponds)} gallons).`,
    );
  }
  if (irrigation != null) {
    bullets.push(
      `${pct(irrigation, total)} was used for irrigation, leaks, and unmetered usage (${formatGallons(irrigation)} gallons).`,
    );
  }

  return bullets;
}

export function monthlyReportTitle(reading: WaterUsageReading): string {
  return `Water Usage Report for ${formatWaterMonthLong(reading.period_month)}`;
}

export function waterReportFileName(reading: WaterUsageReading): string {
  return `Water usage report ${formatWaterMonthLong(reading.period_month)}`;
}

export type WaterChartMonth = {
  key: string;
  label: string;
  rigs: number;
  irrigation: number;
  ponds: number;
  total: number;
};

export type WaterCompareWindow = 6 | 12;

export type YearOverYearChartRow = {
  label: string;
  period: string;
  priorGallons: number | null;
  currentGallons: number | null;
  priorYearLabel: number;
  currentYearLabel: number;
};

function readingsByPeriod(
  readings: WaterUsageReading[],
): Map<string, WaterUsageReading> {
  return new Map(
    readings.map((r) => [r.period_month.slice(0, 7), r] as const),
  );
}

/**
 * Rolling months ending at the selected month (oldest → newest).
 * e.g. May 2026 + 6 → 2025-12 … 2026-05 (May is last).
 */
export function periodsInWindow(
  selectedKey: string,
  window: WaterCompareWindow,
): string[] {
  const selectedYear = Number(selectedKey.slice(0, 4));
  const selectedMonth = Number(selectedKey.slice(5, 7));
  const periods: string[] = [];

  for (let offset = window - 1; offset >= 0; offset -= 1) {
    let m = selectedMonth - offset;
    let y = selectedYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    periods.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  return periods;
}

function periodLabel(period: string): string {
  return formatWaterMonth(`${period}-01`);
}

/** YoY chart: month name only — each slot compares prior vs current calendar year. */
export function yoyAxisLabel(period: string): string {
  const d = new Date(`${period}-01T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function yearOverYearChartData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): YearOverYearChartRow[] {
  const byPeriod = readingsByPeriod(readings);

  return periodsInWindow(selectedKey, window).map((currentPeriod) => {
    const currentYearLabel = Number(currentPeriod.slice(0, 4));
    const mm = currentPeriod.slice(5, 7);
    const priorPeriod = `${currentYearLabel - 1}-${mm}`;
    const prior = byPeriod.get(priorPeriod);
    const current = byPeriod.get(currentPeriod);
    return {
      label: yoyAxisLabel(currentPeriod),
      period: currentPeriod,
      priorGallons: prior?.gallons ?? null,
      currentGallons: current?.gallons ?? null,
      priorYearLabel: currentYearLabel - 1,
      currentYearLabel,
    };
  });
}

export function chartMonthsForSelection(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): WaterChartMonth[] {
  const byPeriod = readingsByPeriod(readings);

  return periodsInWindow(selectedKey, window)
    .map((period) => {
      const reading = byPeriod.get(period);
      if (!reading) return null;
      return {
        key: period,
        label: periodLabel(period),
        rigs: reading.rigs_facilities_gallons ?? 0,
        irrigation: reading.irrigation_leaks_gallons ?? 0,
        ponds: reading.ponds_gallons ?? 0,
        total: reading.gallons ?? 0,
      };
    })
    .filter((row): row is WaterChartMonth => row != null);
}

export type WaterMonthStats = {
  totalGallons: number;
  dailyAverage: number | null;
  vsPriorMonth: number | null;
  vsPriorYear: number | null;
  priorMonthLabel: string | null;
  priorYearMonthLabel: string | null;
};

function priorMonthKey(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function priorYearMonthKey(key: string): string {
  return `${Number(key.slice(0, 4)) - 1}-${key.slice(5, 7)}`;
}

function percentChange(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatPercentChange(change: number | null): string {
  if (change == null) return "—";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export function selectedMonthStats(
  readings: WaterUsageReading[],
  selectedKey: string,
): WaterMonthStats {
  const byPeriod = readingsByPeriod(readings);
  const selected = byPeriod.get(selectedKey);
  const total = selected?.gallons ?? 0;
  const days =
    selected != null ? daysInPeriodMonth(selected.period_month) : 0;
  const dailyAverage =
    total > 0 && days > 0 ? Math.round(total / days) : null;

  const priorKey = priorMonthKey(selectedKey);
  const priorYearKey = priorYearMonthKey(selectedKey);
  const prior = byPeriod.get(priorKey);
  const priorYear = byPeriod.get(priorYearKey);

  return {
    totalGallons: total,
    dailyAverage,
    vsPriorMonth: percentChange(total, prior?.gallons),
    vsPriorYear: percentChange(total, priorYear?.gallons),
    priorMonthLabel: prior ? formatWaterMonth(`${priorKey}-01`) : null,
    priorYearMonthLabel: priorYear
      ? formatWaterMonth(`${priorYearKey}-01`)
      : null,
  };
}

export type OakTwoTankMonth = {
  key: string;
  label: string;
  oakGrove: number;
  twoTank: number;
};

export function oakTwoTankChartData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): OakTwoTankMonth[] {
  const byPeriod = readingsByPeriod(readings);

  return periodsInWindow(selectedKey, window)
    .map((period) => {
      const reading = byPeriod.get(period);
      if (!reading) return null;
      const oak = reading.oak_grove_gallons;
      const twoTank = reading.two_tank_gallons;
      if (oak == null && twoTank == null) return null;
      return {
        key: period,
        label: periodLabel(period),
        oakGrove: oak ?? 0,
        twoTank: twoTank ?? 0,
      };
    })
    .filter((row): row is OakTwoTankMonth => row != null);
}

export type UsageBreakdownSlice = {
  name: string;
  value: number;
  fill: string;
};

export const USAGE_BREAKDOWN_COLORS = {
  rigs: "#f97316",
  ponds: "#22c55e",
  irrigation: "#3b82f6",
} as const;

export function selectedMonthBreakdown(
  reading: WaterUsageReading,
): UsageBreakdownSlice[] {
  const slices: UsageBreakdownSlice[] = [];
  const rigs = reading.rigs_facilities_gallons;
  const ponds = reading.ponds_gallons;
  const irrigation = reading.irrigation_leaks_gallons;

  if (rigs != null && rigs > 0) {
    slices.push({
      name: "Rigs & facilities",
      value: rigs,
      fill: USAGE_BREAKDOWN_COLORS.rigs,
    });
  }
  if (ponds != null && ponds > 0) {
    slices.push({
      name: "Ponds",
      value: ponds,
      fill: USAGE_BREAKDOWN_COLORS.ponds,
    });
  }
  if (irrigation != null && irrigation > 0) {
    slices.push({
      name: "Irrigation & leaks",
      value: irrigation,
      fill: USAGE_BREAKDOWN_COLORS.irrigation,
    });
  }

  return slices;
}

export type TotalTrendPoint = {
  key: string;
  label: string;
  total: number;
};

export function totalUsageTrendData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): TotalTrendPoint[] {
  return chartMonthsForSelection(readings, selectedKey, window).map((row) => ({
    key: row.key,
    label: row.label,
    total: row.total,
  }));
}

export type UsageBreakdownTrendPoint = {
  key: string;
  label: string;
  rigs: number;
  irrigation: number;
  ponds: number;
};

export function usageBreakdownTrendData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): UsageBreakdownTrendPoint[] {
  return chartMonthsForSelection(readings, selectedKey, window).map((row) => ({
    key: row.key,
    label: row.label,
    rigs: row.rigs,
    irrigation: row.irrigation,
    ponds: row.ponds,
  }));
}

export type UsageCategoryMonth = {
  key: string;
  label: string;
  gallons: number;
  pctOfTotal: number | null;
};

function usageCategoryTrendData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
  categoryGallons: (reading: WaterUsageReading) => number | null | undefined,
): UsageCategoryMonth[] {
  const byPeriod = readingsByPeriod(readings);

  return periodsInWindow(selectedKey, window)
    .map((period) => {
      const reading = byPeriod.get(period);
      if (!reading) return null;
      const gallons = categoryGallons(reading);
      if (gallons == null) return null;
      const total = reading.gallons ?? 0;
      return {
        key: period,
        label: periodLabel(period),
        gallons,
        pctOfTotal: total > 0 ? (gallons / total) * 100 : null,
      };
    })
    .filter((row): row is UsageCategoryMonth => row != null);
}

export function pondFillChartData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): UsageCategoryMonth[] {
  return usageCategoryTrendData(
    readings,
    selectedKey,
    window,
    (r) => r.ponds_gallons,
  );
}

export function irrigationTrendChartData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): UsageCategoryMonth[] {
  return usageCategoryTrendData(
    readings,
    selectedKey,
    window,
    (r) => r.irrigation_leaks_gallons,
  );
}

export function rigsTrendChartData(
  readings: WaterUsageReading[],
  selectedKey: string,
  window: WaterCompareWindow,
): UsageCategoryMonth[] {
  return usageCategoryTrendData(
    readings,
    selectedKey,
    window,
    (r) => r.rigs_facilities_gallons,
  );
}

export function rollingTwelveMonthTotal(
  readings: WaterUsageReading[],
  selectedKey: string,
): number | null {
  const months = chartMonthsForSelection(readings, selectedKey, 12);
  if (months.length === 0) return null;
  return months.reduce((sum, row) => sum + row.total, 0);
}

export function rollingTwelveMonthAverage(
  readings: WaterUsageReading[],
  selectedKey: string,
): number | null {
  const months = chartMonthsForSelection(readings, selectedKey, 12);
  if (months.length === 0) return null;
  const sum = months.reduce((acc, row) => acc + row.total, 0);
  return Math.round(sum / months.length);
}

export function vsRollingTwelveMonthAverage(
  readings: WaterUsageReading[],
  selectedKey: string,
): number | null {
  const average = rollingTwelveMonthAverage(readings, selectedKey);
  const total = readingsByPeriod(readings).get(selectedKey)?.gallons ?? 0;
  return percentChange(total, average);
}

const SPIKE_THRESHOLD_PCT = 25;

/** One-line note when the selected month is unusually high vs prior month or year. */
export function waterUsageSpikeCallout(
  readings: WaterUsageReading[],
  selectedKey: string,
): string | null {
  const stats = selectedMonthStats(readings, selectedKey);
  const notes: string[] = [];

  if (
    stats.vsPriorMonth != null &&
    stats.vsPriorMonth >= SPIKE_THRESHOLD_PCT &&
    stats.priorMonthLabel
  ) {
    notes.push(
      `${formatPercentChange(stats.vsPriorMonth)} vs ${stats.priorMonthLabel}`,
    );
  }
  if (
    stats.vsPriorYear != null &&
    stats.vsPriorYear >= SPIKE_THRESHOLD_PCT &&
    stats.priorYearMonthLabel
  ) {
    notes.push(
      `${formatPercentChange(stats.vsPriorYear)} vs ${stats.priorYearMonthLabel}`,
    );
  }

  if (notes.length === 0) return null;
  return `Unusually high usage for this month (${notes.join("; ")}).`;
}
