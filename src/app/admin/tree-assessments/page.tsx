import Link from "next/link";
import { formatPostedEditedLines } from "@/lib/content-dates";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import {
  fetchTreeAssessmentConcerns,
  TREE_ASSESSMENT_SELECT,
} from "@/lib/tree-assessments";
import { assessmentLocationLine } from "@/lib/tree-assessment-display";
import type { TreeAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminTreeAssessmentsPage() {
  await requireStaffRole("manager");
  const supabase = await createClient();
  const [concerns, { data }] = await Promise.all([
    fetchTreeAssessmentConcerns(supabase),
    supabase
      .from("tree_assessments")
      .select(TREE_ASSESSMENT_SELECT)
      .order("updated_at", { ascending: false }),
  ]);

  const assessments = (data ?? []) as unknown as TreeAssessmentWithAuthor[];
  const labelBySlug = new Map(concerns.map((c) => [c.slug, c.label]));

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
            Landscaping assessments
          </h1>
          <p className="text-sm text-muted">Lot evaluations and tree work.</p>
        </div>
        <Link
          href="/admin/compose?area=landscaping&format=structured"
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
                href={`/admin/tree-assessments/${a.id}/edit`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-sm text-brand-700">
                    {assessmentLocationLine(a)}
                  </p>
                  <p className="text-xs text-muted">
                    {labelBySlug.get(a.concern_type)} ·{" "}
                    {a.published ? "Published" : "Draft"} ·{" "}
                    {formatPostedEditedLines(a.created_at, a.updated_at).join(
                      " · ",
                    )}
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
