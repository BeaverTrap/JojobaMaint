import { NextResponse } from "next/server";
import { mapImageVersion, readMapPositions } from "@/lib/map-positions";

export async function GET() {
  try {
    const data = readMapPositions();
    return NextResponse.json({ ...data, imageVersion: mapImageVersion() });
  } catch (e) {
    console.error("Error reading map positions:", e);
    return NextResponse.json(
      { lots: {}, places: {}, valves: {}, imageVersion: 0 },
      { status: 500 },
    );
  }
}
