import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarEvent,
  WaterSupplyMode,
  WaterSystemStatus,
  WaterSystemStatusLevel,
} from "@/lib/database.types";
import type { ParkAlertStatusOverride } from "@/lib/park-alerts";
import { waterAlertClosesFacilities } from "@/lib/park-alerts";

export const WATER_SYSTEM_STATUS_ID = "default";

export const WATER_SYSTEM_STATUS_SELECT =
  "id, supply_mode, status, affected_areas, note, expected_restore_at, updated_by, updated_at";

export function defaultWaterSystemStatus(): WaterSystemStatus {
  return {
    id: WATER_SYSTEM_STATUS_ID,
    supply_mode: "full_pressure",
    status: "normal",
    affected_areas: null,
    note: null,
    expected_restore_at: null,
    updated_by: null,
    updated_at: new Date(0).toISOString(),
  };
}

export async function fetchWaterSystemStatus(
  supabase: SupabaseClient,
): Promise<WaterSystemStatus> {
  const { data, error } = await supabase
    .from("water_system_status")
    .select(WATER_SYSTEM_STATUS_SELECT)
    .eq("id", WATER_SYSTEM_STATUS_ID)
    .maybeSingle();

  if (error || !data) return defaultWaterSystemStatus();
  return data as WaterSystemStatus;
}

export function waterSupplyModeLabel(mode: WaterSupplyMode): string {
  switch (mode) {
    case "gravity":
      return "Gravity feed";
    case "full_pressure":
      return "Full pressure";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function waterStatusLabel(status: WaterSystemStatusLevel): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "active_shutoff":
      return "Active shutoff";
    case "planned_shutoff":
      return "Planned shutoff";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type WaterFacilityClosure = {
  closed: boolean;
  label: string;
  endsAt: string | null;
};

/** Laundry and restrooms close when the park has no water (shutoff). */
export function resolveWaterFacilityClosure(
  waterStatus: WaterSystemStatus,
  waterAlert: ParkAlertStatusOverride | null,
): WaterFacilityClosure {
  const alertClosed =
    waterAlert != null && waterAlertClosesFacilities(waterAlert.alertType);
  const statusClosed =
    waterStatus.status === "active_shutoff" ||
    waterStatus.status === "planned_shutoff";

  if (!alertClosed && !statusClosed) {
    return { closed: false, label: "", endsAt: null };
  }

  const label = waterAlert?.statusLabel ?? waterStatusLabel(waterStatus.status);
  const endsAt =
    waterAlert?.endsAt ?? waterStatus.expected_restore_at ?? null;

  return { closed: true, label, endsAt };
}

/** Calendar titles/descriptions that look like a water shutoff or pressure change. */
const WATER_SHUTOFF_TITLE =
  /water\s*shut|shut\s*off|shutoff|water\s*line|water\s*main|gravity\s*feed|low\s*pressure|valve\s*work/i;

export function isWaterShutoffEvent(event: CalendarEvent): boolean {
  if (WATER_SHUTOFF_TITLE.test(event.title)) return true;
  return event.description ? WATER_SHUTOFF_TITLE.test(event.description) : false;
}

export function upcomingWaterShutoffs(
  events: CalendarEvent[],
): CalendarEvent[] {
  const now = Date.now();
  return events
    .filter(
      (event) =>
        isWaterShutoffEvent(event) &&
        new Date(event.end_time).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
}
