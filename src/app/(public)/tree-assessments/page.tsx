import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchTreeAssessmentConcerns,
  TREE_ASSESSMENT_SELECT,
} from "@/lib/tree-assessments";
import TreeAssessmentsIndex from "@/components/TreeAssessmentsIndex";
import type { TreeAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function TreeAssessmentsPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [concerns, { data }] = await Promise.all([
    fetchTreeAssessmentConcerns(supabase),
    supabase
      .from("tree_assessments")
      .select(TREE_ASSESSMENT_SELECT)
      .eq("published", true)
      .order("updated_at", { ascending: false }),
  ]);

  let assessments = (data ?? []) as unknown as TreeAssessmentWithAuthor[];
  if (isAuthorized) {
    const { data: all } = await supabase
      .from("tree_assessments")
      .select(TREE_ASSESSMENT_SELECT)
      .order("updated_at", { ascending: false });
    assessments = (all ?? []) as unknown as TreeAssessmentWithAuthor[];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Tree assessments
          </h1>
          <p className="text-sm text-muted">
            Lot-specific evaluations — damage, resident inquiries, and our
            findings. Published here for transparency.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin/tree-assessments"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Manage
          </Link>
        )}
      </div>

      <TreeAssessmentsIndex
        assessments={assessments}
        concerns={concerns}
        canEdit={isAuthorized}
      />
    </div>
  );
}
