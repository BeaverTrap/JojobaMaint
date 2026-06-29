// Hand-written types that mirror the SQL migration in supabase/migrations.
// If you change the schema, you can regenerate these with:
//   supabase gen types typescript --local > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole = "staff" | "manager" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_authorized: boolean;
  staff_role: StaffRole | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedEmail {
  email: string;
  note: string | null;
  staff_role: StaffRole;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  poster_avatar?: string | null;
  title: string;
  body: string;
  description: string;
  image_url: string | null;
  category: string;
  parent_post_id: string | null;
  site_number: string | null;
  common_area: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface PostCategory {
  slug: string;
  label: string;
  position: number;
}

// Convenience shapes for joined queries used in the UI.
export type PostAuthor = Pick<Profile, "id" | "display_name" | "avatar_url">;

export type PostWithAuthor = Post & {
  author: PostAuthor | null;
  images: Pick<PostImage, "id" | "image_url" | "position">[];
  parent: Pick<Post, "id" | "title" | "description"> | null;
};

// All image URLs for a post, combining the legacy single image_url (older
// posts) with the post_images rows, ordered by position.
export function postImageUrls(post: {
  image_url: string | null;
  images?: Pick<PostImage, "image_url" | "position">[] | null;
}): string[] {
  const fromTable = (post.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.image_url);
  return post.image_url ? [post.image_url, ...fromTable] : fromTable;
}

export interface ArticleCategory {
  slug: string;
  label: string;
  position: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  reference_list: string | null;
  category: string;
  feed_section: string;
  poster_avatar?: string | null;
  cover_image_url: string | null;
  site_number: string | null;
  common_area: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export type ArticleWithAuthor = Article & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export interface TreeAssessmentConcern {
  slug: string;
  label: string;
  position: number;
}

export interface TreeAssessment {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  reference_list: string | null;
  site_number: string;
  tree_description: string;
  plant_type: string | null;
  concern_type: string;
  how_found: string | null;
  resolution_status: TreeAssessmentResolutionStatus | null;
  resolution_notes: string | null;
  cover_image_url: string | null;
  poster_avatar?: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export type TreeAssessmentWithAuthor = TreeAssessment & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export type TreeAssessmentResolutionStatus =
  | "open"
  | "resolved"
  | "partial"
  | "monitoring"
  | "not-applicable";

export const RESOLUTION_STATUS_OPTIONS: {
  value: "" | TreeAssessmentResolutionStatus;
  label: string;
}[] = [
  { value: "", label: "Not specified" },
  { value: "open", label: "Still open — not resolved yet" },
  { value: "resolved", label: "Resolved" },
  { value: "partial", label: "Partially resolved" },
  { value: "monitoring", label: "Monitoring (watch and wait)" },
  { value: "not-applicable", label: "Not applicable" },
];

export const PLANT_TYPE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "tree", label: "Tree" },
  { value: "shrub", label: "Shrub" },
  { value: "palm", label: "Palm" },
  { value: "cactus", label: "Cactus / succulent" },
  { value: "other", label: "Other plant" },
] as const;

export interface MaintenanceAssessmentWorkType {
  slug: string;
  label: string;
  position: number;
}

export interface MaintenanceAssessmentIssueType {
  slug: string;
  label: string;
  position: number;
}

export type MaintenanceAssessmentResolutionStatus = TreeAssessmentResolutionStatus;

export interface MaintenanceAssessment {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  reference_list: string | null;
  site_number: string | null;
  common_area: string | null;
  work_description: string;
  work_type: string;
  issue_type: string;
  how_found: string | null;
  resolution_status: MaintenanceAssessmentResolutionStatus | null;
  resolution_notes: string | null;
  cover_image_url: string | null;
  poster_avatar?: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export type MaintenanceAssessmentWithAuthor = MaintenanceAssessment & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export type CalendarEventStatus = "confirmed" | "cancelled" | "tentative";

export interface CalendarEvent {
  id: string;
  google_event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  status: CalendarEventStatus;
  created_at: string;
  updated_at: string;
}

export interface PickupGuidelines {
  id: string;
  title: string;
  body: string;
  is_summer_schedule: boolean;
  updated_at: string;
}

export type WaterSupplyMode = "gravity" | "full_pressure";
export type WaterSystemStatusLevel =
  | "normal"
  | "active_shutoff"
  | "planned_shutoff";

export interface WaterSystemStatus {
  id: string;
  supply_mode: WaterSupplyMode;
  status: WaterSystemStatusLevel;
  affected_areas: string | null;
  note: string | null;
  expected_restore_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type PowerStatusLevel = "normal" | "outage" | "planned";

export interface PowerStatus {
  id: string;
  status: PowerStatusLevel;
  note: string | null;
  expected_restore_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type ParkFacilityLocationId =
  | "west"
  | "east"
  | "boondocks"
  | "friendship_hall"
  | "office_ranch";

export interface ParkFacilityStatus {
  id: ParkFacilityLocationId;
  label: string;
  sort_order: number;
  washer_count: number;
  dryer_count: number;
  pet_washer_count: number;
  water_heater_count: number;
  kitchen_sink_count: number;
  oven_count: number;
  washers_out_of_order: number;
  dryers_out_of_order: number;
  pet_washers_out_of_order: number;
  water_heaters_out_of_order: number;
  kitchen_sinks_out_of_order: number;
  ovens_out_of_order: number;
  laundry_note: string | null;
  pet_washer_note: string | null;
  water_heater_note: string | null;
  kitchen_note: string | null;
  note: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ParkRestroomStatus {
  id: string;
  building_id: ParkFacilityLocationId;
  label: string;
  sort_order: number;
  shower_count: number;
  stall_count: number;
  urinal_count: number;
  sink_count: number;
  showers_out_of_order: number;
  stalls_out_of_order: number;
  urinals_out_of_order: number;
  sinks_out_of_order: number;
  note: string | null;
  updated_by: string | null;
  updated_at: string;
}

/** A building with its laundry plus all individual restrooms. */
export interface ParkFacilityBuilding extends ParkFacilityStatus {
  restrooms: ParkRestroomStatus[];
}

export type AnnouncementSeverity = "info" | "notice" | "urgent";

export type ParkAlertType =
  | "general"
  | "water_shutoff"
  | "water_planned"
  | "water_gravity"
  | "power_outage"
  | "power_planned"
  | "laundry";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  alert_type: ParkAlertType;
  starts_at: string;
  ends_at: string | null;
  published: boolean;
  position: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AnnouncementWithAuthor = Announcement & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export interface WaterUsageReading {
  id: string;
  period_month: string;
  gallons: number | null;
  oak_grove_gallons: number | null;
  two_tank_gallons: number | null;
  rigs_facilities_gallons: number | null;
  ponds_gallons: number | null;
  irrigation_leaks_gallons: number | null;
  cost_usd: number | null;
  notes: string | null;
  sheet_row_key: string;
  created_at: string;
  updated_at: string;
}

export interface Lot {
  lot_number: string;
  slug: string;
  zones: string[];
  valves: string[];
  unit_id: string | null;
  has_cross_connection: boolean | null;
  sheet_notes: string | null;
  staff_notes: string | null;
  map_x: number | null;
  map_y: number | null;
  location_type: string;
  place_icon: string | null;
  sheet_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParkMapPositions {
  id: string;
  lots: Record<string, { x: number; y: number }>;
  places: Record<string, { x: number; y: number; icon?: string }>;
  valves: Record<string, { x: number; y: number }>;
  updated_at: string;
}

export type LocationPhotoEntityType = "site" | "valve";

export interface LocationPhoto {
  id: string;
  entity_type: LocationPhotoEntityType;
  entity_key: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}
