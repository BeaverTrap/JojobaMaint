import { syncWaterUsageFromSheet } from "@/lib/google-sheets";
import { syncParkDataFromSheet } from "@/lib/google-valves";

export type SheetSyncType = "water" | "valves";
export type SheetSyncRequestType = SheetSyncType | "all";

export function parseSheetSyncType(
  raw: string | null,
): SheetSyncRequestType | null {
  if (raw === "water" || raw === "valves" || raw === "all") return raw;
  return null;
}

export async function runSheetSync(type: SheetSyncType) {
  if (type === "water") {
    return syncWaterUsageFromSheet();
  }
  return syncParkDataFromSheet();
}

/** Weekly cron job — water first, then valve inventory. */
export async function runAllSheetSyncs() {
  const water = await syncWaterUsageFromSheet();
  const valves = await syncParkDataFromSheet();
  return { water, valves };
}
