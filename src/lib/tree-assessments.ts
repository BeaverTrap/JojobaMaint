import type { SupabaseClient } from "@supabase/supabase-js";
import type { TreeAssessmentConcern } from "@/lib/database.types";

export const TREE_ASSESSMENT_SELECT =
  "id, slug, title, summary, body, reference_list, site_number, tree_description, plant_type, " +
  "concern_type, how_found, resolution_status, resolution_notes, cover_image_url, poster_avatar, published, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export async function fetchTreeAssessmentConcerns(
  supabase: SupabaseClient,
): Promise<TreeAssessmentConcern[]> {
  const { data } = await supabase
    .from("tree_assessment_concerns")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as TreeAssessmentConcern[];
}

export function treeAssessmentStorageFolder(slug: string): string {
  return `tree-assessments/${slug}`;
}
