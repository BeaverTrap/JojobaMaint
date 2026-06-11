import type { SupabaseClient } from "@supabase/supabase-js";

export type LocationPhotoEntityType = "site" | "valve";

export type LocationPhoto = {
  id: string;
  entity_type: LocationPhotoEntityType;
  entity_key: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export function locationPhotoStorageFolder(
  entityType: LocationPhotoEntityType,
  entityKey: string,
): string {
  const safeKey = entityKey.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return entityType === "site"
    ? `sites/${safeKey}`
    : `valves/${safeKey}`;
}

export async function fetchLocationPhotos(
  supabase: SupabaseClient,
  entityType: LocationPhotoEntityType,
  entityKey: string,
): Promise<LocationPhoto[]> {
  const { data, error } = await supabase
    .from("location_photos")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_key", entityKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LocationPhoto[];
}
