export type SiteLocationType = "lot" | "site" | "amenity";

export type SiteRecord = {
  name: string;
  slug: string;
  location_type: SiteLocationType;
  zones: string[];
  valves: string[];
  unit_id: string | null;
  has_cross_connection: boolean | null;
  sheet_notes: string | null;
  staff_notes: string | null;
  place_icon: string | null;
  map_x: number | null;
  map_y: number | null;
  sheet_synced_at: string | null;
};

export function siteTypeLabel(type: SiteLocationType): string {
  switch (type) {
    case "lot":
      return "Lot";
    case "site":
      return "Site";
    case "amenity":
      return "Amenity";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
