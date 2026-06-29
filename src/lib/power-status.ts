import type { SupabaseClient } from "@supabase/supabase-js";
import type { PowerStatus, PowerStatusLevel } from "@/lib/database.types";

export const POWER_STATUS_ID = "default";

export const POWER_STATUS_SELECT =
  "id, status, note, expected_restore_at, updated_by, updated_at";

export function defaultPowerStatus(): PowerStatus {
  return {
    id: POWER_STATUS_ID,
    status: "normal",
    note: null,
    expected_restore_at: null,
    updated_by: null,
    updated_at: new Date(0).toISOString(),
  };
}

export async function fetchPowerStatus(
  supabase: SupabaseClient,
): Promise<PowerStatus> {
  const { data, error } = await supabase
    .from("power_status")
    .select(POWER_STATUS_SELECT)
    .eq("id", POWER_STATUS_ID)
    .maybeSingle();

  if (error || !data) return defaultPowerStatus();
  return data as PowerStatus;
}

export function powerStatusLabel(status: PowerStatusLevel): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "outage":
      return "Known outage";
    case "planned":
      return "Planned outage";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
