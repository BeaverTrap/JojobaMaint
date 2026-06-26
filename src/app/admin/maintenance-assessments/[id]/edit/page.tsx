import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
  MAINTENANCE_ASSESSMENT_SELECT,
} from "@/lib/maintenance-assessments";
import {
  fetchContentTags,
  fetchMaintenanceAssessmentTagSlugs,
} from "@/lib/content-tags";
import MaintenanceAssessmentForm from "@/components/MaintenanceAssessmentForm";
import DeleteMaintenanceAssessmentButton from "@/components/DeleteMaintenanceAssessmentButton";
import type { MaintenanceAssessmentWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditMaintenanceAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaffRole("manager");
  const supabase = await createClient();

  const [{ data: row }, workTypes, issueTypes, contentTags, initialTags] =
    await Promise.all([
      supabase
        .from("maintenance_assessments")
        .select(MAINTENANCE_ASSESSMENT_SELECT)
        .eq("id", id)
        .maybeSingle(),
      fetchMaintenanceAssessmentWorkTypes(supabase),
      fetchMaintenanceAssessmentIssueTypes(supabase),
      fetchContentTags(supabase),
      fetchMaintenanceAssessmentTagSlugs(supabase, id),
    ]);

  if (!row) notFound();
  const a = row as unknown as MaintenanceAssessmentWithAuthor;

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
          Edit assessment
        </h1>
        {a.published && (
          <Link
            href={`/maintenance-assessments/${a.slug}`}
            className="mt-1 inline-block text-sm text-brand-700 hover:underline"
          >
            View public page →
          </Link>
        )}
      </div>

      <MaintenanceAssessmentForm
        mode="edit"
        assessmentId={a.id}
        initialSlug={a.slug}
        initialTitle={a.title}
        initialSummary={a.summary ?? ""}
        initialBody={a.body}
        initialReferenceList={a.reference_list ?? ""}
        initialSiteNumber={a.site_number ?? ""}
        initialCommonArea={a.common_area ?? ""}
        initialWorkDescription={a.work_description}
        initialWorkType={a.work_type}
        initialIssueType={a.issue_type}
        initialHowFound={a.how_found ?? ""}
        initialResolutionStatus={a.resolution_status ?? ""}
        initialResolutionNotes={a.resolution_notes ?? ""}
        initialPublished={a.published}
        initialCoverUrl={a.cover_image_url}
        initialPosterAvatar={a.poster_avatar ?? undefined}
        initialTags={initialTags}
        workTypes={workTypes}
        issueTypes={issueTypes}
        contentTags={contentTags}
        redirectTo="/admin/maintenance-assessments"
      />

      <div className="border-t border-line pt-4">
        <DeleteMaintenanceAssessmentButton
          assessmentId={a.id}
          coverImageUrl={a.cover_image_url}
          redirectTo="/admin/maintenance-assessments"
        />
      </div>
    </div>
  );
}
