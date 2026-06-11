import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncParkDataFromSheet } from "@/lib/google-valves";

export async function POST() {
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
    const result = await syncParkDataFromSheet();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[map sync] failed:", err);
    const message =
      err instanceof Error ? err.message : "Park data sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
