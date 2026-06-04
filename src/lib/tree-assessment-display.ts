import type {
  TreeAssessment,
  TreeAssessmentResolutionStatus,
} from "@/lib/database.types";
import { RESOLUTION_STATUS_OPTIONS } from "@/lib/database.types";

export function assessmentLotLabel(siteNumber: string): string {
  const s = siteNumber.trim();
  return s ? `Site ${s}` : "Site unknown";
}

export function assessmentLocationLine(
  assessment: Pick<TreeAssessment, "site_number" | "tree_description" | "plant_type">,
): string {
  const lot = assessmentLotLabel(assessment.site_number);
  const tree = assessment.tree_description.trim();
  const plant = assessment.plant_type?.trim();
  if (plant) return `${lot} · ${tree} (${plant})`;
  return `${lot} · ${tree}`;
}

export function resolutionStatusLabel(
  status: TreeAssessmentResolutionStatus | null | undefined,
): string | null {
  if (!status) return null;
  return (
    RESOLUTION_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function hasResolutionInfo(
  assessment: Pick<TreeAssessment, "resolution_status" | "resolution_notes">,
): boolean {
  return Boolean(
    assessment.resolution_status || assessment.resolution_notes?.trim(),
  );
}
