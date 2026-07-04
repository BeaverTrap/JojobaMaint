import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type MascotAvatarSettings = {
  scene_id: string;
  overhang_pct: number;
  scale_pct: number;
  offset_y: number;
};

/** GET — public read of all mascot avatar settings. */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mascot_avatar_settings")
    .select("scene_id, overhang_pct, scale_pct, offset_y");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/** POST — webmaster-only upsert of settings for a scene. */
export async function POST(req: NextRequest) {
  const { isWebmaster, userId } = await getCurrentUser();
  if (!isWebmaster || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { scene_id, overhang_pct, scale_pct, offset_y } = body as MascotAvatarSettings;

  if (!scene_id || typeof overhang_pct !== "number" || typeof scale_pct !== "number" || typeof offset_y !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mascot_avatar_settings")
    .upsert(
      {
        scene_id,
        overhang_pct: Math.round(overhang_pct),
        scale_pct: Math.round(scale_pct),
        offset_y: Math.round(offset_y),
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "scene_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
