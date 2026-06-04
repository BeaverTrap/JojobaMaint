import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchMaintenanceAssessmentWorkTypes,
  MAINTENANCE_ASSESSMENT_SELECT,
} from "@/lib/maintenance-assessments";
import MaintenanceAssessmentsIndex from "@/components/MaintenanceAssessmentsIndex";
import type { MaintenanceAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function MaintenanceAssessmentsPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [workTypes, { data }] = await Promise.all([
    fetchMaintenanceAssessmentWorkTypes(supabase),
    supabase
      .from("maintenance_assessments")
      .select(MAINTENANCE_ASSESSMENT_SELECT)
      .eq("published", true)
      .order("updated_at", { ascending: false }),
  ]);

  let assessments = (data ?? []) as unknown as MaintenanceAssessmentWithAuthor[];
  if (isAuthorized) {
    const { data: all } = await supabase
      .from("maintenance_assessments")
      .select(MAINTENANCE_ASSESSMENT_SELECT)
      .order("updated_at", { ascending: false });
    assessments = (all ?? []) as unknown as MaintenanceAssessmentWithAuthor[];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Maintenance assessments
          </h1>
          <p className="text-sm text-muted">
            Pipes, halls, big projects, landscaping (lift week, rentals),
            cross-connection, pond work, and more — published for transparency.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin/maintenance-assessments"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Manage
          </Link>
        )}
      </div>

      <MaintenanceAssessmentsIndex
        assessments={assessments}
        workTypes={workTypes}
        canEdit={isAuthorized}
      />
    </div>
  );
}
