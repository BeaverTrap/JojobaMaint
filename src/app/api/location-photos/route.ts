import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LocationPhotoEntityType } from "@/lib/location-photos";

function isEntityType(value: string): value is LocationPhotoEntityType {
  return value === "site" || value === "valve";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type") ?? "";
  const entityKey = searchParams.get("entity_key")?.trim() ?? "";

  if (!isEntityType(entityType) || !entityKey) {
    return NextResponse.json(
      { error: "entity_type and entity_key are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("location_photos")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_key", entityKey)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photos: data ?? [] });
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

  const body = (await request.json()) as {
    entity_type?: string;
    entity_key?: string;
    image_url?: string;
    caption?: string;
  };

  const entityType = body.entity_type ?? "";
  const entityKey = body.entity_key?.trim() ?? "";
  const imageUrl = body.image_url?.trim() ?? "";
  const caption = body.caption?.trim() || null;

  if (!isEntityType(entityType) || !entityKey || !imageUrl) {
    return NextResponse.json(
      { error: "entity_type, entity_key, and image_url are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("location_photos")
    .insert({
      entity_type: entityType,
      entity_key: entityKey,
      image_url: imageUrl,
      caption,
      uploaded_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photo: data });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("location_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("location_photos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, image_url: row?.image_url ?? null });
}
