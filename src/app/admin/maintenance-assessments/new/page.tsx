import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
} from "@/lib/maintenance-assessments";
import MaintenanceAssessmentForm from "@/components/MaintenanceAssessmentForm";

export const dynamic = "force-dynamic";

export default async function NewMaintenanceAssessmentPage() {
  const supabase = await createClient();
  const [workTypes, issueTypes] = await Promise.all([
    fetchMaintenanceAssessmentWorkTypes(supabase),
    fetchMaintenanceAssessmentIssueTypes(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/maintenance-assessments"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Maintenance assessments
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          New maintenance assessment
        </h1>
        <p className="text-sm text-muted">
          Record work on a site, common area, or project. Publish when ready.
        </p>
      </div>

      <MaintenanceAssessmentForm
        mode="create"
        workTypes={workTypes}
        issueTypes={issueTypes}
        redirectTo="/admin/maintenance-assessments"
      />
    </div>
  );
}
