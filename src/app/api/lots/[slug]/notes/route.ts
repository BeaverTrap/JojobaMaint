import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
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

  const body = (await request.json()) as { staff_notes?: string };
  const staffNotes = body.staff_notes?.trim() ?? "";

  const { data, error } = await supabase
    .from("lots")
    .update({ staff_notes: staffNotes || null })
    .eq("slug", slug)
    .select("slug, staff_notes")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Lot not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...data });
}
