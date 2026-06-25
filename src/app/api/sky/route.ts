import { NextResponse } from "next/server";
import { fetchSkyPageData } from "@/lib/sky/fetch-sky-page";

export const revalidate = 900;

export async function GET() {
  try {
    const data = await fetchSkyPageData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Sky page fetch failed:", e);
    return NextResponse.json(
      { error: "Could not load sky and weather data." },
      { status: 502 },
    );
  }
}
