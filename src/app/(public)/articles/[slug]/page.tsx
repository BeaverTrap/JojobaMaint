import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchArticleCategories, ARTICLE_SELECT } from "@/lib/articles";
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

  const [{ data: article }, categories] = await Promise.all([
    supabase.from("articles").select(ARTICLE_SELECT).eq("slug", slug).maybeSingle(),
    fetchArticleCategories(supabase),
  ]);

  if (!article) notFound();
  const a = article as unknown as ArticleWithAuthor;
  if (!a.published && !isAuthorized) notFound();

  const categoryLabel =
    categories.find((c) => c.slug === a.category)?.label ?? a.category;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/articles"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All articles
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
            {categoryLabel}
          </span>
          {!a.published && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
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

      <ShareButtons
        content={{
          path: `/articles/${a.slug}`,
          title: a.title,
          description: a.summary,
        }}
      />

      {a.cover_image_url && (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-line">
          <Image
            src={a.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            priority
          />
        </div>
      )}

      <ArticleBody body={a.body} />
      <ReferencesSection referenceList={a.reference_list} />
    </article>
  );
}
