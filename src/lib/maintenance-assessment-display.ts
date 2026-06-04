import type { MaintenanceAssessment } from "@/lib/database.types";

export function maintenanceLocationLine(
  assessment: Pick<
    MaintenanceAssessment,
    "site_number" | "common_area" | "work_description"
  >,
): string {
  const work = assessment.work_description.trim();
  const site = assessment.site_number?.trim();
  const area = assessment.common_area?.trim();

  const parts: string[] = [];
  if (site) parts.push(`Site ${site}`);
  if (area) parts.push(area);
  if (parts.length === 0) return work;
  return `${parts.join(" · ")} · ${work}`;
}
