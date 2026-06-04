import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentCoverImage from "@/components/ContentCoverImage";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ARTICLE_SELECT,
  ARTICLE_TAG_EMBED,
  enrichArticle,
} from "@/lib/articles";
import ContentTagList from "@/components/ContentTagList";
import ArticleBody from "@/components/ArticleBody";
import ReferencesSection from "@/components/ReferencesSection";
import type { ArticleWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import ShareButtons from "@/components/ShareButtons";

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
    .select(ARTICLE_SELECT + ARTICLE_TAG_EMBED)
    .eq("slug", slug)
    .maybeSingle();

  if (!article) notFound();
  const a = enrichArticle(
    article as unknown as Parameters<typeof enrichArticle>[0],
  );
  if (!a.published && !isAuthorized) notFound();

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/articles"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All articles
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ContentTagList tags={a.tags} />
          {!a.published && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Draft
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {a.title}
        </h1>
        {a.summary && (
          <p className="mt-2 text-base text-muted">{a.summary}</p>
        )}
        <p className="mt-2 text-xs text-muted">
          Updated {format(new Date(a.updated_at), "MMMM d, yyyy")}
          {a.author?.display_name && ` · ${a.author.display_name}`}
        </p>
        {isAuthorized && (
          <Link
            href={`/admin/articles/${a.id}/edit`}
            className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Edit article
          </Link>
        )}
      </div>

      <ArticleBody body={a.body} />
      <ReferencesSection referenceList={a.reference_list} />

      <ShareButtons
        content={{
          path: `/articles/${a.slug}`,
          title: a.title,
          description: a.summary,
        }}
      />
    </article>
  );
}
