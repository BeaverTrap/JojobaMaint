import { NextResponse } from "next/server";
import { getValveById, getValveData } from "@/lib/google-valves";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ valveId: string }> },
) {
  try {
    const { valveId } = await params;
    const [valve, meta] = await Promise.all([
      getValveById(valveId),
      getValveData(),
    ]);

    if (!valve) {
      return NextResponse.json({ error: "Valve not found" }, { status: 404 });
    }

    return NextResponse.json({
      valve,
      updatedAt: meta.updatedAt,
      stale: meta.stale,
    });
  } catch (error) {
    console.error("Error in /api/valves/[valveId]:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch valve";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
