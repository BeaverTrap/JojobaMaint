"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PrintReportButton from "@/components/PrintReportButton";
import PrintReportHeader from "@/components/PrintReportHeader";
import type { WaterUsageReading } from "@/lib/database.types";
import {
  buildMonthlyReportBullets,
  chartMonthsForSelection,
  formatPercentChange,
  monthlyReportTitle,
  irrigationTrendChartData,
  oakTwoTankChartData,
  pondFillChartData,
  rigsTrendChartData,
  rollingTwelveMonthAverage,
  rollingTwelveMonthTotal,
  vsRollingTwelveMonthAverage,
  selectedMonthBreakdown,
  selectedMonthStats,
  totalUsageTrendData,
  usageBreakdownTrendData,
  waterReportFileName,
  waterUsageSpikeCallout,
  yearOverYearChartData,
  type UsageCategoryMonth,
  type WaterChartMonth,
  type WaterCompareWindow,
} from "@/lib/water-monthly-report";
import {
  formatGallons,
  formatWaterDataAsOf,
  formatWaterMonthLong,
  periodMonthKey,
} from "@/lib/water-usage";
import {
  DEFAULT_WATER_CHART_PREFERENCES,
  isWaterChartWindowKey,
  loadWaterChartPreferences,
  normalizeChartOrder,
  parseChartOrder,
  parseCollapsedChartSections,
  readStoredChartWindow,
  saveWaterChartPreferences,
  waterChartWindowKeys,
  type WaterChartSectionId,
} from "@/lib/water-chart-preferences";

const STACK_COLORS = {
  rigs: "#f97316",
  irrigation: "#3b82f6",
  ponds: "#22c55e",
} as const;

const YOY_COLORS = {
  prior: "#22c55e",
  current: "#3b82f6",
} as const;

const PUMP_COLORS = {
  oak: "#84cc16",
  twoTank: "#8b5cf6",
} as const;

const TREND_COLOR = "#0ea5e9";

function changeTone(change: number | null): string {
  if (change == null) return "text-muted";
  if (change > 0) return "text-amber-700 dark:text-amber-300";
  if (change < 0) return "text-green-700 dark:text-green-300";
  return "text-muted";
}

function gallonAxisTick(v: number): string {
  return Number(v) >= 1_000_000
    ? `${(Number(v) / 1_000_000).toFixed(1)}M`
    : `${Math.round(Number(v) / 1000)}k`;
}

function WaterChartFrame({
  heightPx,
  className,
  children,
}: {
  heightPx: number;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <div
      className={`water-report-charts mt-4 w-full min-w-0 ${className ?? ""}`}
      style={{ height: heightPx }}
    >
      <ResponsiveContainer width="100%" height={heightPx} minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  valueClassName,
}: {
  label: string;
  value: string;
  detail?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums text-ink sm:text-xl ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {detail && <p className="mt-0.5 text-xs text-muted">{detail}</p>}
    </div>
  );
}

function CollapseChartButton({
  collapsed,
  onToggle,
  label,
}: {
  collapsed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="no-print inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-muted ring-1 ring-line transition-colors hover:bg-hover hover:text-ink"
      aria-expanded={!collapsed}
      aria-label={collapsed ? `Show ${label} chart` : `Hide ${label} chart`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`}
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
      {collapsed ? "Show" : "Hide"}
    </button>
  );
}

function ChartSectionToolbar({
  sectionId,
  order,
  onMove,
  children,
}: {
  sectionId: WaterChartSectionId;
  order: WaterChartSectionId[];
  onMove: (id: WaterChartSectionId, direction: -1 | 1) => void;
  children?: React.ReactNode;
}) {
  const index = order.indexOf(sectionId);
  const canMoveUp = index > 0;
  const canMoveDown = index >= 0 && index < order.length - 1;

  return (
    <div className="no-print flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        disabled={!canMoveUp}
        onClick={() => onMove(sectionId, -1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted ring-1 ring-line transition hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Move chart up"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        disabled={!canMoveDown}
        onClick={() => onMove(sectionId, 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted ring-1 ring-line transition hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Move chart down"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {children}
    </div>
  );
}

function ChartRangeToggle({
  value,
  onChange,
}: {
  value: WaterCompareWindow;
  onChange: (window: WaterCompareWindow) => void;
}) {
  return (
    <div
      className="no-print inline-flex h-7 shrink-0 items-center gap-0.5 rounded-lg bg-canvas p-0.5 ring-1 ring-line"
      role="group"
      aria-label="Chart range"
    >
      {([6, 12] as const).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={
            value === n
              ? "rounded-md bg-surface px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink shadow-sm ring-1 ring-line/60"
              : "rounded-md px-2.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:text-ink"
          }
        >
          {n} mo
        </button>
      ))}
    </div>
  );
}

function UsageCategoryTrendSection({
  title,
  description,
  window,
  onWindowChange,
  data,
  barName,
  fill,
  emptyMessage,
  collapsed,
  onToggleCollapse,
  sectionId,
  chartOrder,
  onMoveChart,
}: {
  title: string;
  description: string;
  window: WaterCompareWindow;
  onWindowChange: (window: WaterCompareWindow) => void;
  data: UsageCategoryMonth[];
  barName: string;
  fill: string;
  emptyMessage: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  sectionId: WaterChartSectionId;
  chartOrder: WaterChartSectionId[];
  onMoveChart: (id: WaterChartSectionId, direction: -1 | 1) => void;
}) {
  return (
    <section
      style={{ order: chartOrder.indexOf(sectionId) }}
      className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${collapsed ? "print-exclude" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        <ChartSectionToolbar
          sectionId={sectionId}
          order={chartOrder}
          onMove={onMoveChart}
        >
          {!collapsed && (
            <ChartRangeToggle value={window} onChange={onWindowChange} />
          )}
          <CollapseChartButton
            collapsed={collapsed}
            onToggle={onToggleCollapse}
            label={title}
          />
        </ChartSectionToolbar>
      </div>
      {!collapsed && (
        <>
      <p className="mt-1 text-xs text-muted print-report-meta">{description}</p>
      {data.length > 0 ? (
        <WaterChartFrame heightPx={256}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                interval={0}
                angle={window === 12 ? -35 : 0}
                textAnchor={window === 12 ? "end" : "middle"}
                height={window === 12 ? 56 : 32}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                width={56}
                tickFormatter={gallonAxisTick}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-line)",
                  background: "var(--color-surface)",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as UsageCategoryMonth;
                  if (!row) return null;
                  const pct =
                    row.pctOfTotal != null
                      ? `${row.pctOfTotal.toFixed(1)}% of total`
                      : null;
                  return (
                    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-ink">{row.label}</p>
                      <p className="mt-1 text-muted">
                        {row.gallons.toLocaleString()} gal
                      </p>
                      {pct && <p className="text-muted">{pct}</p>}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="gallons"
                name={barName}
                fill={fill}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
        </WaterChartFrame>
      ) : (
        <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
      )}
        </>
      )}
      {collapsed && (
        <p className="no-print mt-2 text-xs text-muted">
          Hidden from print and PDF
        </p>
      )}
    </section>
  );
}

function UsageMixChart({
  data,
  window,
}: {
  data: WaterChartMonth[];
  window: WaterCompareWindow;
}) {
  if (data.length === 0) {
    return <p className="mt-4 text-sm text-muted">No data for this range.</p>;
  }

  return (
    <WaterChartFrame heightPx={288}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            interval={0}
            angle={window === 12 ? -35 : 0}
            textAnchor={window === 12 ? "end" : "middle"}
            height={window === 12 ? 56 : 32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            width={56}
            tickFormatter={gallonAxisTick}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--color-line)",
              background: "var(--color-surface)",
            }}
            formatter={(value) => [
              `${Number(value ?? 0).toLocaleString()} gal`,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="rigs"
            name="Rigs & facilities"
            stackId="usage"
            fill={STACK_COLORS.rigs}
          />
          <Bar
            dataKey="irrigation"
            name="Irrigation, leaks, etc."
            stackId="usage"
            fill={STACK_COLORS.irrigation}
          />
          <Bar
            dataKey="ponds"
            name="Ponds"
            stackId="usage"
            fill={STACK_COLORS.ponds}
          />
        </BarChart>
    </WaterChartFrame>
  );
}

export default function WaterUsageDashboard({
  readings,
  lastSyncedAt = null,
}: {
  readings: WaterUsageReading[];
  lastSyncedAt?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const latestKey = readings.at(-1)
    ? periodMonthKey(readings.at(-1)!.period_month)
    : "";
  const selectedKey = searchParams.get("month") ?? latestKey;

  const collapsedSections = useMemo(() => {
    if (searchParams.has("collapsed")) {
      return parseCollapsedChartSections(searchParams.get("collapsed"));
    }
    return new Set(loadWaterChartPreferences().collapsed);
  }, [searchParams]);

  const chartOrder = useMemo(() => {
    if (searchParams.has("order")) {
      return parseChartOrder(searchParams.get("order"));
    }
    return normalizeChartOrder(loadWaterChartPreferences().order);
  }, [searchParams]);

  const legacyWindow = searchParams.get("window");
  const defaults = DEFAULT_WATER_CHART_PREFERENCES.windows;

  const mixWindow = readStoredChartWindow(
    "mix",
    legacyWindow,
    searchParams.get("mix") ?? searchParams.get("mixA"),
    defaults.mix,
  );
  const compareWindow = readStoredChartWindow(
    "compare",
    legacyWindow,
    searchParams.get("compare"),
    defaults.compare,
  );
  const pumpWindow = readStoredChartWindow(
    "pump",
    legacyWindow,
    searchParams.get("pump"),
    defaults.pump,
  );
  const pondWindow = readStoredChartWindow(
    "pond",
    legacyWindow,
    searchParams.get("pond"),
    defaults.pond,
  );
  const irrigationWindow = readStoredChartWindow(
    "irrigation",
    legacyWindow,
    searchParams.get("irrigation"),
    defaults.irrigation,
  );
  const rigsWindow = readStoredChartWindow(
    "rigs",
    legacyWindow,
    searchParams.get("rigs"),
    defaults.rigs,
  );
  const categoriesWindow = readStoredChartWindow(
    "categories",
    legacyWindow,
    searchParams.get("categories"),
    defaults.categories,
  );
  const trendWindow = readStoredChartWindow(
    "trend",
    legacyWindow,
    searchParams.get("trend"),
    defaults.trend,
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const prefs = loadWaterChartPreferences();
    let changed = false;

    const hasPerChartWindow = waterChartWindowKeys().some((key) =>
      params.has(key),
    );

    if (!legacyWindow && !hasPerChartWindow) {
      for (const key of waterChartWindowKeys()) {
        params.set(key, String(prefs.windows[key]));
      }
      changed = true;
    }

    if (!params.has("collapsed") && prefs.collapsed.length > 0) {
      params.set("collapsed", prefs.collapsed.join(","));
      changed = true;
    }

    if (!params.has("order")) {
      params.set("order", prefs.order.join(","));
      changed = true;
    }

    if (changed) {
      router.replace(`/water?${params.toString()}`, { scroll: false });
    }
  }, [legacyWindow, router, searchParams]);

  const selected = useMemo(
    () =>
      readings.find((r) => periodMonthKey(r.period_month) === selectedKey) ??
      readings.at(-1) ??
      null,
    [readings, selectedKey],
  );

  const selectedPeriodKey = selected
    ? periodMonthKey(selected.period_month)
    : "";

  const usageMixData = useMemo(
    () =>
      selected
        ? chartMonthsForSelection(readings, selectedPeriodKey, mixWindow)
        : [],
    [readings, selected, selectedPeriodKey, mixWindow],
  );

  const yoyRows = useMemo(
    () =>
      selected
        ? yearOverYearChartData(readings, selectedPeriodKey, compareWindow)
        : [],
    [readings, selected, selectedPeriodKey, compareWindow],
  );

  const monthStats = useMemo(
    () =>
      selected ? selectedMonthStats(readings, selectedPeriodKey) : null,
    [readings, selected, selectedPeriodKey],
  );

  const breakdownSlices = useMemo(
    () => (selected ? selectedMonthBreakdown(selected) : []),
    [selected],
  );

  const pumpData = useMemo(
    () =>
      selected
        ? oakTwoTankChartData(readings, selectedPeriodKey, pumpWindow)
        : [],
    [readings, selected, selectedPeriodKey, pumpWindow],
  );

  const pondData = useMemo(
    () =>
      selected
        ? pondFillChartData(readings, selectedPeriodKey, pondWindow)
        : [],
    [readings, selected, selectedPeriodKey, pondWindow],
  );

  const irrigationData = useMemo(
    () =>
      selected
        ? irrigationTrendChartData(readings, selectedPeriodKey, irrigationWindow)
        : [],
    [readings, selected, selectedPeriodKey, irrigationWindow],
  );

  const rigsData = useMemo(
    () =>
      selected
        ? rigsTrendChartData(readings, selectedPeriodKey, rigsWindow)
        : [],
    [readings, selected, selectedPeriodKey, rigsWindow],
  );

  const rollingTwelveTotal = useMemo(
    () =>
      selected ? rollingTwelveMonthTotal(readings, selectedPeriodKey) : null,
    [readings, selected, selectedPeriodKey],
  );

  const rollingTwelveAvg = useMemo(
    () =>
      selected ? rollingTwelveMonthAverage(readings, selectedPeriodKey) : null,
    [readings, selected, selectedPeriodKey],
  );

  const vsTwelveMonthAvg = useMemo(
    () =>
      selected ? vsRollingTwelveMonthAverage(readings, selectedPeriodKey) : null,
    [readings, selected, selectedPeriodKey],
  );

  const spikeCallout = useMemo(
    () =>
      selected ? waterUsageSpikeCallout(readings, selectedPeriodKey) : null,
    [readings, selected, selectedPeriodKey],
  );

  const categoriesTrendData = useMemo(
    () =>
      selected
        ? usageBreakdownTrendData(readings, selectedPeriodKey, categoriesWindow)
        : [],
    [readings, selected, selectedPeriodKey, categoriesWindow],
  );

  const trendData = useMemo(
    () =>
      selected
        ? totalUsageTrendData(readings, selectedPeriodKey, trendWindow)
        : [],
    [readings, selected, selectedPeriodKey, trendWindow],
  );

  const dataAsOf = formatWaterDataAsOf(lastSyncedAt);

  const monthOptions = useMemo(
    () =>
      [...readings]
        .reverse()
        .map((r) => ({
          key: periodMonthKey(r.period_month),
          label: formatWaterMonthLong(r.period_month),
        })),
    [readings],
  );

  function persistChartPreferences(
    collapsed: WaterChartSectionId[],
    windows?: Partial<typeof defaults>,
    order?: WaterChartSectionId[],
  ) {
    const current = loadWaterChartPreferences();
    saveWaterChartPreferences({
      collapsed,
      windows: windows ? { ...current.windows, ...windows } : current.windows,
      order: order ?? current.order,
    });
  }

  function isSectionCollapsed(id: WaterChartSectionId): boolean {
    return collapsedSections.has(id);
  }

  function toggleSection(id: WaterChartSectionId) {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(collapsedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const collapsed = [...next];
    if (collapsed.length === 0) params.set("collapsed", "");
    else params.set("collapsed", collapsed.join(","));
    persistChartPreferences(collapsed, undefined, chartOrder);
    router.replace(`/water?${params.toString()}`, { scroll: false });
  }

  function expandAllCharts() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("collapsed", "");
    persistChartPreferences([], undefined, chartOrder);
    router.replace(`/water?${params.toString()}`, { scroll: false });
  }

  function moveChart(id: WaterChartSectionId, direction: -1 | 1) {
    const index = chartOrder.indexOf(id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= chartOrder.length) return;

    const next = [...chartOrder];
    [next[index], next[target]] = [next[target], next[index]];

    const params = new URLSearchParams(searchParams.toString());
    params.set("order", next.join(","));
    persistChartPreferences([...collapsedSections], undefined, next);
    router.replace(`/water?${params.toString()}`, { scroll: false });
  }

  function setChartWindow(param: string, window: WaterCompareWindow) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, String(window));
    params.delete("window");
    if (isWaterChartWindowKey(param)) {
      persistChartPreferences([...collapsedSections], { [param]: window }, chartOrder);
    }
    router.replace(`/water?${params.toString()}`, { scroll: false });
  }

  function updateMonth(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.replace(`/water?${params.toString()}`, { scroll: false });
  }

  if (readings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <p className="text-3xl">💧</p>
        <p className="mt-3 text-sm font-medium text-ink">No monthly reports yet</p>
        <p className="mt-1 text-sm text-muted">
          Reports will appear here once they&apos;re available.
        </p>
      </div>
    );
  }

  if (!selected) {
    return null;
  }

  const bullets = buildMonthlyReportBullets(selected);
  const yoyChartRows = yoyRows.map((row) => ({
    label: row.label,
    prior: row.priorGallons ?? 0,
    current: row.currentGallons ?? 0,
    priorYearLabel: row.priorYearLabel,
    currentYearLabel: row.currentYearLabel,
  }));

  const monthLabel = formatWaterMonthLong(selected.period_month);

  return (
    <div className="print-report space-y-6">
      <PrintReportHeader />

      <div className="no-print flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <label htmlFor="water-month" className="text-sm font-medium text-ink">
            Select month
          </label>
          <select
            id="water-month"
            value={periodMonthKey(selected.period_month)}
            onChange={(e) => updateMonth(e.target.value)}
            className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink sm:w-auto"
          >
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {collapsedSections.size > 0 && (
            <button
              type="button"
              onClick={expandAllCharts}
              className="no-print rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:bg-hover"
            >
              Show all charts
            </button>
          )}
          <PrintReportButton fileName={waterReportFileName(selected)} />
        </div>
      </div>

      {dataAsOf && (
        <p className="print-report-meta text-xs text-muted">
          Data as of {dataAsOf}
        </p>
      )}

      <div className="print-report-content space-y-6">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-ink">
            {monthlyReportTitle(selected)}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
            {bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <div className="flex w-full flex-col gap-6">
        <section
          style={{ order: chartOrder.indexOf("mix") }}
          className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("mix") ? "print-exclude" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">
              Where is the water going?
            </h2>
            <ChartSectionToolbar
              sectionId="mix"
              order={chartOrder}
              onMove={moveChart}
            >
              {!isSectionCollapsed("mix") && (
                <ChartRangeToggle
                  value={mixWindow}
                  onChange={(n) => setChartWindow("mix", n)}
                />
              )}
              <CollapseChartButton
                collapsed={isSectionCollapsed("mix")}
                onToggle={() => toggleSection("mix")}
                label="Where is the water going?"
              />
            </ChartSectionToolbar>
          </div>
          {!isSectionCollapsed("mix") && (
            <>
              <p className="mt-1 text-xs text-muted print-report-meta">
                Rigs &amp; facilities vs. ponds vs. irrigation, leaks, etc. —{" "}
                {mixWindow} months ending {monthLabel}
              </p>
              <UsageMixChart data={usageMixData} window={mixWindow} />
            </>
          )}
          {isSectionCollapsed("mix") && (
            <p className="no-print mt-2 text-xs text-muted">
              Hidden from print and PDF
            </p>
          )}
        </section>

        <section
          style={{ order: chartOrder.indexOf("compare") }}
          className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("compare") ? "print-exclude" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">
              Compare monthly gallons used
            </h2>
            <ChartSectionToolbar
              sectionId="compare"
              order={chartOrder}
              onMove={moveChart}
            >
              {!isSectionCollapsed("compare") && (
                <ChartRangeToggle
                  value={compareWindow}
                  onChange={(n) => setChartWindow("compare", n)}
                />
              )}
              <CollapseChartButton
                collapsed={isSectionCollapsed("compare")}
                onToggle={() => toggleSection("compare")}
                label="Compare monthly gallons used"
              />
            </ChartSectionToolbar>
          </div>
          {!isSectionCollapsed("compare") && (
            <>
          <p className="mt-1 text-xs text-muted print-report-meta">
            Same calendar month, year over year — {compareWindow} months ending{" "}
            {monthLabel} (oldest → newest). Green is the prior year; blue is the
            current year for that month.
          </p>
          <WaterChartFrame heightPx={288}>
              <BarChart
                data={yoyChartRows}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                barGap={2}
                barCategoryGap="18%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-line)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  width={56}
                  tickFormatter={gallonAxisTick}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--color-line)",
                    background: "var(--color-surface)",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as (typeof yoyChartRows)[0];
                    if (!row) return null;
                    const fmt = (n: number) =>
                      n > 0 ? `${n.toLocaleString()} gal` : "No data";
                    return (
                      <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-ink">
                          {row.label} — {row.priorYearLabel} vs{" "}
                          {row.currentYearLabel}
                        </p>
                        <p className="mt-1 text-muted">
                          {row.priorYearLabel}: {fmt(row.prior)}
                        </p>
                        <p className="text-muted">
                          {row.currentYearLabel}: {fmt(row.current)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="prior"
                  name="Prior year"
                  fill={YOY_COLORS.prior}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="current"
                  name="Current year"
                  fill={YOY_COLORS.current}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
          </WaterChartFrame>
            </>
          )}
          {isSectionCollapsed("compare") && (
            <p className="no-print mt-2 text-xs text-muted">
              Hidden from print and PDF
            </p>
          )}
        </section>

        {monthStats && (
          <section
            style={{ order: chartOrder.indexOf("snapshot") }}
            className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("snapshot") ? "print-exclude" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">Month snapshot</h2>
              <ChartSectionToolbar
                sectionId="snapshot"
                order={chartOrder}
                onMove={moveChart}
              >
                <CollapseChartButton
                  collapsed={isSectionCollapsed("snapshot")}
                  onToggle={() => toggleSection("snapshot")}
                  label="Month snapshot"
                />
              </ChartSectionToolbar>
            </div>
            {!isSectionCollapsed("snapshot") && (
            <div className="mt-4 grid gap-5 md:grid-cols-2 md:items-center">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-ink">
                  This month&apos;s mix
                </h2>
                <p className="mt-1 text-xs text-muted print-report-meta">
                  Where water went in {monthLabel}
                </p>
                {breakdownSlices.length > 0 ? (
                  <WaterChartFrame heightPx={192} className="mt-3">
                      <PieChart>
                        <Pie
                          data={breakdownSlices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="46%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={2}
                        >
                          {breakdownSlices.map((slice) => (
                            <Cell key={slice.name} fill={slice.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-line)",
                            background: "var(--color-surface)",
                          }}
                          formatter={(value) => [
                            `${Number(value ?? 0).toLocaleString()} gal`,
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                      </PieChart>
                  </WaterChartFrame>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    No breakdown data for this month.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Total usage"
                    value={`${formatGallons(monthStats.totalGallons)} gal`}
                  />
                  <StatCard
                    label="Daily average"
                    value={
                      monthStats.dailyAverage != null
                        ? `${formatGallons(monthStats.dailyAverage)} gal`
                        : "—"
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Vs. prior month"
                    value={formatPercentChange(monthStats.vsPriorMonth)}
                    detail={
                      monthStats.priorMonthLabel
                        ? `Compared to ${monthStats.priorMonthLabel}`
                        : "No prior month data"
                    }
                    valueClassName={changeTone(monthStats.vsPriorMonth)}
                  />
                  <StatCard
                    label="Vs. same month last year"
                    value={formatPercentChange(monthStats.vsPriorYear)}
                    detail={
                      monthStats.priorYearMonthLabel
                        ? `Compared to ${monthStats.priorYearMonthLabel}`
                        : "No prior-year data"
                    }
                    valueClassName={changeTone(monthStats.vsPriorYear)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Last 12 months"
                    value={
                      rollingTwelveTotal != null
                        ? `${formatGallons(rollingTwelveTotal)} gal`
                        : "—"
                    }
                    detail={`Ending ${monthLabel}`}
                  />
                  <StatCard
                    label="Vs. 12-mo average"
                    value={formatPercentChange(vsTwelveMonthAvg)}
                    detail={
                      rollingTwelveAvg != null
                        ? `Avg ${formatGallons(rollingTwelveAvg)} gal/mo`
                        : "Not enough history"
                    }
                    valueClassName={changeTone(vsTwelveMonthAvg)}
                  />
                </div>
              </div>
              {spikeCallout && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 md:col-span-2">
                  {spikeCallout}
                </p>
              )}
            </div>
            )}
            {isSectionCollapsed("snapshot") && (
              <p className="no-print mt-2 text-xs text-muted">
                Hidden from print and PDF
              </p>
            )}
          </section>
        )}

          <section
            style={{ order: chartOrder.indexOf("pump") }}
            className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("pump") ? "print-exclude" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">
                Oak Grove vs. Two Tank
              </h2>
              <ChartSectionToolbar
                sectionId="pump"
                order={chartOrder}
                onMove={moveChart}
              >
                {!isSectionCollapsed("pump") && (
                  <ChartRangeToggle
                    value={pumpWindow}
                    onChange={(n) => setChartWindow("pump", n)}
                  />
                )}
                <CollapseChartButton
                  collapsed={isSectionCollapsed("pump")}
                  onToggle={() => toggleSection("pump")}
                  label="Oak Grove vs. Two Tank"
                />
              </ChartSectionToolbar>
            </div>
            {!isSectionCollapsed("pump") && (
              <>
            <p className="mt-1 text-xs text-muted print-report-meta">
              Pumping sources — {pumpWindow} months ending {monthLabel}
            </p>
            {pumpData.length > 0 ? (
              <WaterChartFrame heightPx={256}>
                  <BarChart
                    data={pumpData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-line)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                      interval={0}
                      angle={pumpWindow === 12 ? -35 : 0}
                      textAnchor={pumpWindow === 12 ? "end" : "middle"}
                      height={pumpWindow === 12 ? 56 : 32}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                      width={56}
                      tickFormatter={gallonAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-surface)",
                      }}
                      formatter={(value) => [
                        `${Number(value ?? 0).toLocaleString()} gal`,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="oakGrove"
                      name="Oak Grove"
                      stackId="pump"
                      fill={PUMP_COLORS.oak}
                    />
                    <Bar
                      dataKey="twoTank"
                      name="Two Tank"
                      stackId="pump"
                      fill={PUMP_COLORS.twoTank}
                    />
                  </BarChart>
              </WaterChartFrame>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No pumping source data for this range.
              </p>
            )}
              </>
            )}
            {isSectionCollapsed("pump") && (
              <p className="no-print mt-2 text-xs text-muted">
                Hidden from print and PDF
              </p>
            )}
          </section>

          <UsageCategoryTrendSection
            title="Pond fill"
            description={`Gallons used to fill the ponds — ${pondWindow} months ending ${monthLabel}`}
            window={pondWindow}
            onWindowChange={(n) => setChartWindow("pond", n)}
            data={pondData}
            barName="Pond fill"
            fill={STACK_COLORS.ponds}
            emptyMessage="No pond fill data for this range."
            collapsed={isSectionCollapsed("pond")}
            onToggleCollapse={() => toggleSection("pond")}
            sectionId="pond"
            chartOrder={chartOrder}
            onMoveChart={moveChart}
          />

          <UsageCategoryTrendSection
            title="Irrigation & leaks"
            description={`Irrigation, leaks, and unmetered usage — ${irrigationWindow} months ending ${monthLabel}`}
            window={irrigationWindow}
            onWindowChange={(n) => setChartWindow("irrigation", n)}
            data={irrigationData}
            barName="Irrigation & leaks"
            fill={STACK_COLORS.irrigation}
            emptyMessage="No irrigation data for this range."
            collapsed={isSectionCollapsed("irrigation")}
            onToggleCollapse={() => toggleSection("irrigation")}
            sectionId="irrigation"
            chartOrder={chartOrder}
            onMoveChart={moveChart}
          />
          <UsageCategoryTrendSection
            title="Rigs & facilities"
            description={`Rigs and facilities usage — ${rigsWindow} months ending ${monthLabel}`}
            window={rigsWindow}
            onWindowChange={(n) => setChartWindow("rigs", n)}
            data={rigsData}
            barName="Rigs & facilities"
            fill={STACK_COLORS.rigs}
            emptyMessage="No rigs & facilities data for this range."
            collapsed={isSectionCollapsed("rigs")}
            onToggleCollapse={() => toggleSection("rigs")}
            sectionId="rigs"
            chartOrder={chartOrder}
            onMoveChart={moveChart}
          />

        <section
          style={{ order: chartOrder.indexOf("categories") }}
          className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("categories") ? "print-exclude" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">Usage by category</h2>
            <ChartSectionToolbar
              sectionId="categories"
              order={chartOrder}
              onMove={moveChart}
            >
              {!isSectionCollapsed("categories") && (
                <ChartRangeToggle
                  value={categoriesWindow}
                  onChange={(n) => setChartWindow("categories", n)}
                />
              )}
              <CollapseChartButton
                collapsed={isSectionCollapsed("categories")}
                onToggle={() => toggleSection("categories")}
                label="Usage by category"
              />
            </ChartSectionToolbar>
          </div>
          {!isSectionCollapsed("categories") && (
            <>
              <p className="mt-1 text-xs text-muted print-report-meta">
                Rigs, irrigation, and ponds — {categoriesWindow} months ending{" "}
                {monthLabel}
              </p>
              {categoriesTrendData.length > 0 ? (
                <WaterChartFrame heightPx={256}>
                    <LineChart
                      data={categoriesTrendData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-line)"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                        interval={0}
                        angle={categoriesWindow === 12 ? -35 : 0}
                        textAnchor={
                          categoriesWindow === 12 ? "end" : "middle"
                        }
                        height={categoriesWindow === 12 ? 56 : 32}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                        width={56}
                        tickFormatter={gallonAxisTick}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid var(--color-line)",
                          background: "var(--color-surface)",
                        }}
                        formatter={(value) => [
                          `${Number(value ?? 0).toLocaleString()} gal`,
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="rigs"
                        name="Rigs & facilities"
                        stroke={STACK_COLORS.rigs}
                        strokeWidth={2}
                        dot={{ r: 3, fill: STACK_COLORS.rigs }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="irrigation"
                        name="Irrigation & leaks"
                        stroke={STACK_COLORS.irrigation}
                        strokeWidth={2}
                        dot={{ r: 3, fill: STACK_COLORS.irrigation }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ponds"
                        name="Ponds"
                        stroke={STACK_COLORS.ponds}
                        strokeWidth={2}
                        dot={{ r: 3, fill: STACK_COLORS.ponds }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                </WaterChartFrame>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  No category trend data for this range.
                </p>
              )}
            </>
          )}
          {isSectionCollapsed("categories") && (
            <p className="no-print mt-2 text-xs text-muted">
              Hidden from print and PDF
            </p>
          )}
        </section>

        <section
          style={{ order: chartOrder.indexOf("trend") }}
          className={`w-full shrink-0 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${isSectionCollapsed("trend") ? "print-exclude" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">Total usage trend</h2>
            <ChartSectionToolbar
              sectionId="trend"
              order={chartOrder}
              onMove={moveChart}
            >
              {!isSectionCollapsed("trend") && (
                <ChartRangeToggle
                  value={trendWindow}
                  onChange={(n) => setChartWindow("trend", n)}
                />
              )}
              <CollapseChartButton
                collapsed={isSectionCollapsed("trend")}
                onToggle={() => toggleSection("trend")}
                label="Total usage trend"
              />
            </ChartSectionToolbar>
          </div>
          {!isSectionCollapsed("trend") && (
            <>
          <p className="mt-1 text-xs text-muted print-report-meta">
            Overall gallons — {trendWindow} months ending {monthLabel}
          </p>
          {trendData.length > 0 ? (
            <WaterChartFrame heightPx={256}>
                <LineChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-line)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    interval={0}
                    angle={trendWindow === 12 ? -35 : 0}
                    textAnchor={trendWindow === 12 ? "end" : "middle"}
                    height={trendWindow === 12 ? 56 : 32}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    width={56}
                    tickFormatter={gallonAxisTick}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--color-line)",
                      background: "var(--color-surface)",
                    }}
                    formatter={(value) => [
                      `${Number(value ?? 0).toLocaleString()} gal`,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total gallons"
                    stroke={TREND_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: TREND_COLOR }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
            </WaterChartFrame>
          ) : (
            <p className="mt-4 text-sm text-muted">No trend data for this range.</p>
          )}
            </>
          )}
          {isSectionCollapsed("trend") && (
            <p className="no-print mt-2 text-xs text-muted">
              Hidden from print and PDF
            </p>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
