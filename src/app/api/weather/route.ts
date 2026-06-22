import { NextResponse } from "next/server";
import { fetchParkWeatherSnapshot } from "@/lib/park-weather";

export const revalidate = 900;

export async function GET() {
  try {
    const snapshot = await fetchParkWeatherSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("Park weather fetch failed:", e);
    return NextResponse.json(
      { error: "Could not load weather for the park." },
      { status: 502 },
    );
  }
}
