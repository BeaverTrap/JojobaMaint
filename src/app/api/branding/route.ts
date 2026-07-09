import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type SiteBranding = {
  brand_50: string;
  brand_100: string;
  brand_200: string;
  brand_300: string;
  brand_400: string;
  brand_500: string;
  brand_600: string;
  brand_700: string;
  brand_800: string;
  brand_900: string;
  brand_950: string;
  gold: string;
  wordmark_primary: string;
  wordmark_accent: string;
  avatar_ring: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_branding")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(null);
  }

  const branding: SiteBranding = {
    brand_50: data.brand_50,
    brand_100: data.brand_100,
    brand_200: data.brand_200,
    brand_300: data.brand_300,
    brand_400: data.brand_400,
    brand_500: data.brand_500,
    brand_600: data.brand_600,
    brand_700: data.brand_700,
    brand_800: data.brand_800,
    brand_900: data.brand_900,
    brand_950: data.brand_950,
    gold: data.gold,
    wordmark_primary: data.wordmark_primary,
    wordmark_accent: data.wordmark_accent,
    avatar_ring: data.avatar_ring,
  };

  return NextResponse.json(branding);
}

export async function POST(req: NextRequest) {
  const { isWebmaster, userId } = await getCurrentUser();
  if (!isWebmaster || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: SiteBranding = await req.json();

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_branding")
    .upsert(
      {
        id: "default",
        ...body,
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
