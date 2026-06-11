import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteToSlug } from "@/lib/site-slug";
import { fetchSiteBySlug } from "@/lib/sites";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await fetchSiteBySlug(supabase, siteToSlug(slug));

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: site.name,
    slug: site.slug,
    zones: site.zones,
    valves: site.valves,
    unit_id: site.unit_id,
    has_cross_connection: site.has_cross_connection,
    location_type: site.location_type,
  });
}
