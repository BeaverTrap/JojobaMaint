import { NextResponse } from "next/server";
import { fetchNearbyPowerOutages } from "@/lib/power-outages";

export const revalidate = 900;

export async function GET() {
  try {
    const result = await fetchNearbyPowerOutages();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[power outages] failed:", err);
    return NextResponse.json(
      { error: "Outage data unavailable" },
      { status: 502 },
    );
  }
}
