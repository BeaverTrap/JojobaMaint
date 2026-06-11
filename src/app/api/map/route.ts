import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMapPositions,
  mapImageVersion,
  saveMapPositions,
  type MapPositions,
} from "@/lib/map-positions";

export async function GET() {
  try {
    const supabase = await createClient();
    const data = await fetchMapPositions(supabase);
    return NextResponse.json({ ...data, imageVersion: mapImageVersion() });
  } catch (e) {
    console.error("Error reading map positions:", e);
    return NextResponse.json(
      { lots: {}, places: {}, valves: {}, imageVersion: 0 },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_authorized")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<MapPositions>;
    const existing = await fetchMapPositions(supabase);
    const positions: MapPositions = {
      lots: body.lots ?? existing.lots,
      places: body.places ?? existing.places,
      valves: body.valves ?? existing.valves,
    };
    await saveMapPositions(positions);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error writing map positions:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
