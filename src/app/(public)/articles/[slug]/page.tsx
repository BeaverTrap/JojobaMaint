import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentCoverImage from "@/components/ContentCoverImage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ARTICLE_SELECT,
  ARTICLE_TAG_EMBED,
  ARTICLE_RELATED_EMBED,
  enrichArticle,
} from "@/lib/articles";
import { postLocationLabel } from "@/lib/post-display";
import { siteHref } from "@/lib/site-slug";
import ContentTagList from "@/components/ContentTagList";
import ArticleBody from "@/components/ArticleBody";
import ReferencesSection from "@/components/ReferencesSection";
import FeedSectionBadge from "@/components/FeedSectionBadge";
import PrintReportHeader from "@/components/PrintReportHeader";
import PrintReportToolbar from "@/components/PrintReportToolbar";
import type { ArticleWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import { formatPostedEditedLines } from "@/lib/content-dates";
import { parseFeedSection } from "@/lib/feed-section";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (!article) return { title: "Article" };
  const a = article as unknown as ArticleWithAuthor;
  return buildContentMetadata({
    title: a.title,
    description: a.summary ?? a.body.slice(0, 160),
    path: `/articles/${slug}`,
    imageUrl: a.cover_image_url,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const { data: article } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT + ARTICLE_TAG_EMBED + ARTICLE_RELATED_EMBED)
    .eq("slug", slug)
    .maybeSingle();

  if (!article) notFound();
  const a = enrichArticle(
    article as unknown as Parameters<typeof enrichArticle>[0],
  );
  if (!a.published && !isAuthorized) notFound();

  const dateLines = formatPostedEditedLines(a.created_at, a.updated_at);
  const feedSection = parseFeedSection(a.feed_section);

  return (
    <article className="print-report space-y-6">
      <PrintReportHeader />
      <PrintReportToolbar
        backHref="/"
        backLabel="← Back to feed"
        fileName={a.title}
        shareContent={{
          path: `/articles/${a.slug}`,
          title: a.title,
          description: a.summary,
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FeedSectionBadge section={feedSection} />
          <ContentTagList tags={a.tags} />
          {!a.published && (
            <span className="no-print rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Draft
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {a.title}
        </h1>
        {a.summary && (
          <p className="print-report-meta mt-2 text-base text-muted">{a.summary}</p>
        )}
        {postLocationLabel(a) && (
          <p className="print-report-meta mt-2 text-base font-medium text-brand-700">
            {a.site_number?.trim() ? (
              <>
                <Link href={siteHref(a.site_number)} className="hover:underline">
                  Site {a.site_number.trim()}
                </Link>
                {a.common_area?.trim() && <> · {a.common_area.trim()}</>}
              </>
            ) : (
              a.common_area?.trim()
            )}
          </p>
        )}
        <div className="print-report-meta mt-3 text-xs text-muted">
          {dateLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {isAuthorized && (
          <Link
            href={`/admin/articles/${a.id}/edit`}
            className="no-print mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Edit article
          </Link>
        )}
      </div>

      <ArticleBody body={a.body} />
      {a.relatedArticles.length > 0 && (
        <section className="no-print space-y-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Related articles
          </h2>
          <ul className="space-y-2">
            {a.relatedArticles.map((rel) => (
              <li key={rel.id}>
                <Link
                  href={`/articles/${rel.slug}`}
                  className="block rounded-lg px-2 py-1.5 transition hover:bg-hover"
                >
                  <span className="font-medium text-ink">{rel.title}</span>
                  {rel.summary?.trim() && (
                    <span className="mt-0.5 block text-sm text-muted">
                      {rel.summary.trim()}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ReferencesSection referenceList={a.reference_list} />
    </article>
  );
}
