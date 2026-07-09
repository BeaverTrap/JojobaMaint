import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { WeatherMascotLayoutConfig } from "@/lib/weather-mascot-layout";

/** GET — public read of the live weather mascot layout. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weather_mascot_layout")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(null);
  }

  const layout: WeatherMascotLayoutConfig = {
    width: 718,
    height: 512,
    map: { left: data.map_left, top: data.map_top, width: data.map_width, height: data.map_height },
    quail: { left: data.quail_left, top: data.quail_top, width: data.quail_width, height: data.quail_height },
    tempHotspot: { left: data.temp_left, top: data.temp_top, width: data.temp_width, height: data.temp_height },
    ...(data.stage_bottom_pad != null ? { stageBottomPad: data.stage_bottom_pad } : {}),
  };

  return NextResponse.json(layout);
}

/** POST — webmaster-only save of weather layout. */
export async function POST(req: NextRequest) {
  const { isWebmaster, userId } = await getCurrentUser();
  if (!isWebmaster || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: WeatherMascotLayoutConfig = await req.json();

  const supabase = await createClient();
  const { error } = await supabase
    .from("weather_mascot_layout")
    .upsert(
      {
        id: "default",
        map_left: body.map.left,
        map_top: body.map.top,
        map_width: body.map.width,
        map_height: body.map.height,
        quail_left: body.quail.left,
        quail_top: body.quail.top,
        quail_width: body.quail.width,
        quail_height: body.quail.height,
        temp_left: body.tempHotspot.left,
        temp_top: body.tempHotspot.top,
        temp_width: body.tempHotspot.width,
        temp_height: body.tempHotspot.height,
        stage_bottom_pad: body.stageBottomPad ?? null,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
