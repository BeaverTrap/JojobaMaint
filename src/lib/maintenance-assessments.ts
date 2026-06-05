import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceAssessmentIssueType,
  MaintenanceAssessmentWorkType,
} from "@/lib/database.types";

export const MAINTENANCE_ASSESSMENT_SELECT =
  "id, slug, title, summary, body, reference_list, site_number, common_area, work_description, " +
  "work_type, issue_type, how_found, resolution_status, resolution_notes, cover_image_url, poster_avatar, published, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export async function fetchMaintenanceAssessmentWorkTypes(
  supabase: SupabaseClient,
): Promise<MaintenanceAssessmentWorkType[]> {
  const { data } = await supabase
    .from("maintenance_assessment_work_types")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as MaintenanceAssessmentWorkType[];
}

export async function fetchMaintenanceAssessmentIssueTypes(
  supabase: SupabaseClient,
): Promise<MaintenanceAssessmentIssueType[]> {
  const { data } = await supabase
    .from("maintenance_assessment_issue_types")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as MaintenanceAssessmentIssueType[];
}

export function maintenanceAssessmentStorageFolder(slug: string): string {
  return `maintenance-assessments/${slug}`;
}
