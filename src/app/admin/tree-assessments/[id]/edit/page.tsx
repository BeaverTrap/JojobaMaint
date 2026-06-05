import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchTreeAssessmentConcerns,
  TREE_ASSESSMENT_SELECT,
} from "@/lib/tree-assessments";
import {
  fetchContentTags,
  fetchTreeAssessmentTagSlugs,
} from "@/lib/content-tags";
import TreeAssessmentForm from "@/components/TreeAssessmentForm";
import DeleteTreeAssessmentButton from "@/components/DeleteTreeAssessmentButton";
import type { TreeAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditTreeAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: row }, concerns, contentTags, initialTags] = await Promise.all([
    supabase
      .from("tree_assessments")
      .select(TREE_ASSESSMENT_SELECT)
      .eq("id", id)
      .maybeSingle(),
    fetchTreeAssessmentConcerns(supabase),
    fetchContentTags(supabase),
    fetchTreeAssessmentTagSlugs(supabase, id),
  ]);

  if (!row) notFound();
  const a = row as unknown as TreeAssessmentWithAuthor;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tree-assessments"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Tree assessments
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Edit assessment
        </h1>
        {a.published && (
          <Link
            href={`/tree-assessments/${a.slug}`}
            className="mt-1 inline-block text-sm text-brand-700 hover:underline"
          >
            View public page →
          </Link>
        )}
      </div>

      <TreeAssessmentForm
        mode="edit"
        assessmentId={a.id}
        initialSlug={a.slug}
        initialTitle={a.title}
        initialSummary={a.summary ?? ""}
        initialBody={a.body}
        initialReferenceList={a.reference_list ?? ""}
        initialSiteNumber={a.site_number}
        initialTreeDescription={a.tree_description}
        initialPlantType={a.plant_type ?? ""}
        initialConcernType={a.concern_type}
        initialHowFound={a.how_found ?? ""}
        initialResolutionStatus={a.resolution_status ?? ""}
        initialResolutionNotes={a.resolution_notes ?? ""}
        initialPublished={a.published}
        initialCoverUrl={a.cover_image_url}
        initialPosterAvatar={a.poster_avatar ?? undefined}
        initialTags={initialTags}
        concerns={concerns}
        contentTags={contentTags}
        redirectTo="/admin/tree-assessments"
      />

      <div className="border-t border-line pt-4">
        <DeleteTreeAssessmentButton
          assessmentId={a.id}
          coverImageUrl={a.cover_image_url}
          redirectTo="/admin/tree-assessments"
        />
      </div>
    </div>
  );
}
