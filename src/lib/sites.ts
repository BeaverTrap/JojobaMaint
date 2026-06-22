import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lot } from "@/lib/database.types";
import type { MapPlacePosition } from "@/lib/map-positions";
import { fetchMapPositions } from "@/lib/map-positions";
import { siteToSlug } from "@/lib/site-slug";
import { PLACE_ICON_DEFAULTS } from "@/lib/map-place-icons";
import type { SiteLocationType, SiteRecord } from "@/lib/site-types";

export type { SiteLocationType, SiteRecord } from "@/lib/site-types";
export { siteTypeLabel } from "@/lib/site-types";

function lotToSite(lot: Lot): SiteRecord {
  return {
    name: lot.lot_number,
    slug: lot.slug,
    location_type: (lot.location_type as SiteLocationType) ?? "lot",
    zones: lot.zones,
    valves: lot.valves,
    unit_id: lot.unit_id,
    has_cross_connection: lot.has_cross_connection,
    sheet_notes: lot.sheet_notes,
    staff_notes: lot.staff_notes,
    place_icon: lot.place_icon,
    map_x: lot.map_x,
    map_y: lot.map_y,
    sheet_synced_at: lot.sheet_synced_at,
  };
}

function inferLocationType(name: string): SiteLocationType {
  if (/^\d+$/.test(name.trim())) return "lot";
  return "site";
}

function buildAmenitySite(
  name: string,
  pos: MapPlacePosition,
): SiteRecord {
  return {
    name,
    slug: siteToSlug(name),
    location_type: "amenity",
    zones: [],
    valves: [],
    unit_id: null,
    has_cross_connection: null,
    sheet_notes: null,
    staff_notes: null,
    place_icon: pos.icon ?? PLACE_ICON_DEFAULTS[name] ?? null,
    map_x: pos.x ?? null,
    map_y: pos.y ?? null,
    sheet_synced_at: null,
  };
}

export async function fetchSites(supabase: SupabaseClient): Promise<SiteRecord[]> {
  const [{ data: lotRows, error }, mapPositions] = await Promise.all([
    supabase.from("lots").select("*").order("lot_number", { ascending: true }),
    fetchMapPositions(supabase),
  ]);
  if (error) throw error;

  const bySlug = new Map<string, SiteRecord>();
  for (const lot of (lotRows ?? []) as Lot[]) {
    bySlug.set(lot.slug, lotToSite(lot));
  }

  for (const [name, pos] of Object.entries(mapPositions.lots)) {
    const slug = siteToSlug(name);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        name,
        slug,
        location_type: inferLocationType(name),
        zones: [],
        valves: [],
        unit_id: null,
        has_cross_connection: null,
        sheet_notes: null,
        staff_notes: null,
        place_icon: null,
        map_x: pos.x,
        map_y: pos.y,
        sheet_synced_at: null,
      });
    }
  }

  for (const [name, pos] of Object.entries(mapPositions.places)) {
    const slug = siteToSlug(name);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, buildAmenitySite(name, pos));
    } else {
      const existing = bySlug.get(slug)!;
      if (existing.location_type === "lot" && !existing.place_icon) {
        existing.place_icon = pos.icon ?? PLACE_ICON_DEFAULTS[name] ?? null;
      }
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    const aNum = parseInt(a.name, 10);
    const bNum = parseInt(b.name, 10);
    const aIsNum = !Number.isNaN(aNum) && /^\d+$/.test(a.name);
    const bIsNum = !Number.isNaN(bNum) && /^\d+$/.test(b.name);
    if (aIsNum && bIsNum) return aNum - bNum;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function fetchSiteBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<SiteRecord | null> {
  const sites = await fetchSites(supabase);
  return sites.find((s) => s.slug === slug) ?? null;
}
