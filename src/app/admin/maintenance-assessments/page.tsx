import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMaintenanceAssessmentWorkTypes,
  MAINTENANCE_ASSESSMENT_SELECT,
} from "@/lib/maintenance-assessments";
import { maintenanceLocationLine } from "@/lib/maintenance-assessment-display";
import type { MaintenanceAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminMaintenanceAssessmentsPage() {
  const supabase = await createClient();
  const [workTypes, { data }] = await Promise.all([
    fetchMaintenanceAssessmentWorkTypes(supabase),
    supabase
      .from("maintenance_assessments")
      .select(MAINTENANCE_ASSESSMENT_SELECT)
      .order("updated_at", { ascending: false }),
  ]);

  const assessments = (data ?? []) as unknown as MaintenanceAssessmentWithAuthor[];
  const labelBySlug = new Map(workTypes.map((w) => [w.slug, w.label]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
            Maintenance assessments
          </h1>
          <p className="text-sm text-muted">
            Document pipes, halls, big projects, landscaping, cross-connection,
            pond work, and more for public transparency.
          </p>
        </div>
        <Link
          href="/admin/maintenance-assessments/new"
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          + New assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No assessments yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/maintenance-assessments/${a.id}/edit`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-sm text-brand-700">
                    {maintenanceLocationLine(a)}
                  </p>
                  <p className="text-xs text-muted">
                    {labelBySlug.get(a.work_type)} ·{" "}
                    {a.published ? "Published" : "Draft"} ·{" "}
                    {formatDistanceToNow(new Date(a.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-brand-700">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
