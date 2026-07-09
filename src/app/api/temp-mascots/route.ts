import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type TempMascot = {
  id: string;
  label: string;
  src: string;
  category: string;
  active: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("temp_mascots")
    .select("id, label, src, category, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { isWebmaster, userId } = await getCurrentUser();
  if (!isWebmaster || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { label, src, category } = body as {
    label: string;
    src: string;
    category: string;
  };

  if (!label || !src) {
    return NextResponse.json(
      { error: "label and src are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("temp_mascots")
    .insert({
      label,
      src,
      category: category || "mascot",
      created_by: userId,
    })
    .select("id, label, src, category, active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { isWebmaster } = await getCurrentUser();
  if (!isWebmaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("temp_mascots")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
