import type { TreeAssessment } from "@/lib/database.types";

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
