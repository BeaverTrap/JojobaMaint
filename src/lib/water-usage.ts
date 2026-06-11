import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaterUsageReading } from "@/lib/database.types";

export const WATER_USAGE_SELECT =
  "id, period_month, gallons, oak_grove_gallons, two_tank_gallons, rigs_facilities_gallons, ponds_gallons, irrigation_leaks_gallons, sheet_row_key, created_at, updated_at";

/** Rows from the old year-over-year parser or empty future months. */
export function isStaleWaterReading(row: WaterUsageReading): boolean {
  if (row.sheet_row_key.includes(":compare:")) return true;
  if ((row.gallons ?? 0) <= 0) return true;
  return false;
}

export async function fetchWaterUsageReadings(
  supabase: SupabaseClient,
): Promise<WaterUsageReading[]> {
  const { data, error } = await supabase
    .from("water_usage_readings")
    .select(WATER_USAGE_SELECT)
    .order("period_month", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as WaterUsageReading[]).filter(
    (row) => !isStaleWaterReading(row),
  );
}

export function formatWaterMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatWaterMonthLong(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function periodMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function daysInPeriodMonth(isoDate: string): number {
  const [y, m] = isoDate.slice(0, 7).split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function formatPercent(value: number | null, total: number | null): string {
  if (value == null || total == null || total <= 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function formatGallons(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatCost(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export async function fetchWaterSyncState(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("water_usage_sync_state")
    .select("last_synced_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) return null;
  return (data?.last_synced_at as string | null) ?? null;
}

export function formatWaterDataAsOf(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
