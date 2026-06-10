import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCoverImage from "@/components/ContentCoverImage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchTreeAssessmentConcerns,
  TREE_ASSESSMENT_SELECT,
} from "@/lib/tree-assessments";
import { assessmentLocationLine } from "@/lib/tree-assessment-display";
import ArticleBody from "@/components/ArticleBody";
import ReferencesSection from "@/components/ReferencesSection";
import AssessmentResolutionSection from "@/components/AssessmentResolutionSection";
import type { TreeAssessmentWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import PostPostHeader from "@/components/PostPostHeader";
import PrintReportHeader from "@/components/PrintReportHeader";
import PrintReportToolbar from "@/components/PrintReportToolbar";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tree_assessments")
    .select(TREE_ASSESSMENT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return { title: "Tree assessment" };
  const a = row as unknown as TreeAssessmentWithAuthor;
  return buildContentMetadata({
    title: a.title,
    description: a.summary ?? assessmentLocationLine(a),
    path: `/tree-assessments/${slug}`,
    imageUrl: a.cover_image_url,
  });
}

export default async function TreeAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [{ data: row }, concerns] = await Promise.all([
    supabase
      .from("tree_assessments")
      .select(TREE_ASSESSMENT_SELECT)
      .eq("slug", slug)
      .maybeSingle(),
    fetchTreeAssessmentConcerns(supabase),
  ]);

  if (!row) notFound();
  const a = row as unknown as TreeAssessmentWithAuthor;
  if (!a.published && !isAuthorized) notFound();

  const concernLabel =
    concerns.find((c) => c.slug === a.concern_type)?.label ?? a.concern_type;

  return (
    <article className="print-report space-y-6">
      <PrintReportHeader />
      <PrintReportToolbar
        backHref="/?section=landscaping"
        backLabel="← All landscaping assessments"
        fileName={a.title}
        shareContent={{
          path: `/tree-assessments/${a.slug}`,
          title: a.title,
          description: assessmentLocationLine(a),
        }}
      />

      <div className="print-report-content">
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
            feedSection="landscaping"
            createdAt={a.created_at}
            updatedAt={a.updated_at}
            avatarSize={40}
            isDraft={!a.published}
            canEdit={isAuthorized}
            editHref={`/admin/tree-assessments/${a.id}/edit`}
          />
        </div>
        <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
          {concernLabel}
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {a.title}
        </h1>
        <p className="print-report-meta mt-2 text-base font-medium text-brand-700">
          {assessmentLocationLine(a)}
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
          <p className="print-report-meta mt-3 text-base text-muted">{a.summary}</p>
        )}
      </div>

      <ArticleBody body={a.body} />
      <AssessmentResolutionSection assessment={a} />
      <ReferencesSection referenceList={a.reference_list} />
    </article>
  );
}
