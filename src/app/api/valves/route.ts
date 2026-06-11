import { NextResponse } from "next/server";
import {
  clearValveCache,
  getLotsForZone,
  getValveData,
  getValvesForZone,
  getZonesForLot,
} from "@/lib/google-valves";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lotNumber = searchParams.get("lot");
    const zoneName = searchParams.get("zone");
    const refresh = searchParams.get("refresh");

    if (refresh === "1" || refresh === "true") {
      clearValveCache();
    }

    if (lotNumber) {
      const zones = await getZonesForLot(lotNumber);
      return NextResponse.json({ lot: lotNumber, zones });
    }

    if (zoneName) {
      const [lots, valves] = await Promise.all([
        getLotsForZone(zoneName),
        getValvesForZone(zoneName),
      ]);
      return NextResponse.json({ zone: zoneName, lots, valves });
    }

    const result = await getValveData();
    return NextResponse.json({
      updatedAt: result.updatedAt,
      stale: result.stale,
      count: result.data.length,
      valves: result.data,
    });
  } catch (error) {
    console.error("Error in /api/valves:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch valves";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
