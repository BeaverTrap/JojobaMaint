import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentCoverImage from "@/components/ContentCoverImage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
  MAINTENANCE_ASSESSMENT_SELECT,
} from "@/lib/maintenance-assessments";
import { maintenanceLocationLine } from "@/lib/maintenance-assessment-display";
import ArticleBody from "@/components/ArticleBody";
import ReferencesSection from "@/components/ReferencesSection";
import AssessmentResolutionSection from "@/components/AssessmentResolutionSection";
import type { MaintenanceAssessmentWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import ShareButtons from "@/components/ShareButtons";
import PostPostHeader from "@/components/PostPostHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("maintenance_assessments")
    .select(MAINTENANCE_ASSESSMENT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return { title: "Maintenance assessment" };
  const a = row as unknown as MaintenanceAssessmentWithAuthor;
  return buildContentMetadata({
    title: a.title,
    description: a.summary ?? maintenanceLocationLine(a),
    path: `/maintenance-assessments/${slug}`,
    imageUrl: a.cover_image_url,
  });
}

export default async function MaintenanceAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [{ data: row }, workTypes, issueTypes] = await Promise.all([
    supabase
      .from("maintenance_assessments")
      .select(MAINTENANCE_ASSESSMENT_SELECT)
      .eq("slug", slug)
      .maybeSingle(),
    fetchMaintenanceAssessmentWorkTypes(supabase),
    fetchMaintenanceAssessmentIssueTypes(supabase),
  ]);

  if (!row) notFound();
  const a = row as unknown as MaintenanceAssessmentWithAuthor;
  if (!a.published && !isAuthorized) notFound();

  const workLabel =
    workTypes.find((w) => w.slug === a.work_type)?.label ?? a.work_type;
  const issueLabel =
    issueTypes.find((i) => i.slug === a.issue_type)?.label ?? a.issue_type;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/maintenance-assessments"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All maintenance assessments
        </Link>
        {a.cover_image_url && (
          <div className="mt-4">
            <ContentCoverImage
              src={a.cover_image_url}
              alt={a.title}
              variant="hero"
              priority
            />
          </div>
        )}
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <PostPostHeader
            posterAvatar={a.poster_avatar}
            categoryLabel="Maintenance"
            createdAt={a.created_at}
            updatedAt={a.updated_at}
            avatarSize={40}
            isDraft={!a.published}
            canEdit={isAuthorized}
            editHref={`/admin/maintenance-assessments/${a.id}/edit`}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
            {workLabel}
          </span>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted">
            {issueLabel}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {a.title}
        </h1>
        <p className="mt-2 text-base font-medium text-brand-700">
          {maintenanceLocationLine(a)}
        </p>
        {a.how_found && (
          <div className="mt-4 rounded-xl border border-line bg-hover px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              How this was found
            </p>
            <p className="mt-1 text-base text-ink">{a.how_found}</p>
          </div>
        )}
        {a.summary && (
          <p className="mt-3 text-base text-muted">{a.summary}</p>
        )}
      </div>

      <ArticleBody body={a.body} />
      <AssessmentResolutionSection assessment={a} />
      <ReferencesSection referenceList={a.reference_list} />

      <ShareButtons
        content={{
          path: `/maintenance-assessments/${a.slug}`,
          title: a.title,
          description: maintenanceLocationLine(a),
        }}
      />
    </article>
  );
}
