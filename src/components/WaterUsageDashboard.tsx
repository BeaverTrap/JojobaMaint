"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WaterUsageReading } from "@/lib/database.types";
import {
  formatCost,
  formatGallons,
  formatWaterMonth,
} from "@/lib/water-usage";

export default function WaterUsageDashboard({
  readings,
}: {
  readings: WaterUsageReading[];
}) {
  const chartData = useMemo(
    () =>
      readings.map((r) => ({
        month: formatWaterMonth(r.period_month),
        gallons: r.gallons ?? 0,
        cost: r.cost_usd ?? 0,
        notes: r.notes,
      })),
    [readings],
  );

  const stats = useMemo(() => {
    const withGallons = readings.filter((r) => r.gallons != null);
    const totalGallons = withGallons.reduce((s, r) => s + (r.gallons ?? 0), 0);
    const avgGallons =
      withGallons.length > 0 ? totalGallons / withGallons.length : null;
    const latest = readings[readings.length - 1] ?? null;
    const withCost = readings.filter((r) => r.cost_usd != null);
    const totalCost = withCost.reduce((s, r) => s + (r.cost_usd ?? 0), 0);

    return { totalGallons, avgGallons, latest, totalCost };
  }, [readings]);

  if (readings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <p className="text-3xl">💧</p>
        <p className="mt-3 text-sm font-medium text-ink">No water data yet</p>
        <p className="mt-1 text-sm text-muted">
          Staff can sync from the Google Sheet once it is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Latest month"
          value={
            stats.latest
              ? formatGallons(stats.latest.gallons)
              : "—"
          }
          sub={
            stats.latest
              ? `${formatWaterMonth(stats.latest.period_month)} gallons`
              : undefined
          }
        />
        <StatCard
          label="Monthly average"
          value={formatGallons(stats.avgGallons)}
          sub="gallons"
        />
        <StatCard
          label="Total tracked cost"
          value={formatCost(stats.totalCost)}
          sub={`${readings.length} months`}
        />
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-ink">Gallons per month</h2>
        <div className="mt-4 h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-line)",
                  background: "var(--color-surface)",
                }}
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString()} gal`,
                  "Usage",
                ]}
              />
              <Bar
                dataKey="gallons"
                fill="var(--color-brand-500)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {chartData.some((d) => d.cost > 0) && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold text-ink">Cost trend</h2>
          <div className="mt-4 h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  width={56}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--color-line)",
                    background: "var(--color-surface)",
                  }}
                  formatter={(value) => [
                    formatCost(Number(value ?? 0)),
                    "Cost",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-brand-600)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-brand-600)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-ink">Monthly data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-canvas/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5">Gallons</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[...readings].reverse().map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {formatWaterMonth(row.period_month)}
                  </td>
                  <td className="px-4 py-2.5 text-ink">
                    {formatGallons(row.gallons)}
                  </td>
                  <td className="px-4 py-2.5 text-ink">
                    {formatCost(row.cost_usd)}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-2.5 text-muted">
                    {row.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
