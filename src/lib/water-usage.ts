import type { SupabaseClient } from "@supabase/supabase-js";
import type { WaterUsageReading } from "@/lib/database.types";

export const WATER_USAGE_SELECT =
  "id, period_month, gallons, cost_usd, notes, sheet_row_key, created_at, updated_at";

export async function fetchWaterUsageReadings(
  supabase: SupabaseClient,
): Promise<WaterUsageReading[]> {
  const { data, error } = await supabase
    .from("water_usage_readings")
    .select(WATER_USAGE_SELECT)
    .order("period_month", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WaterUsageReading[];
}

export function formatWaterMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
