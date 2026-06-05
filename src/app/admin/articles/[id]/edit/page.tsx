import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchArticleCategories, ARTICLE_SELECT } from "@/lib/articles";
import { fetchArticleTagSlugs } from "@/lib/content-tags";
import ArticleForm from "@/components/ArticleForm";
import DeleteArticleButton from "@/components/DeleteArticleButton";
import type { ArticleWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: article }, tags, initialTags] = await Promise.all([
    supabase.from("articles").select(ARTICLE_SELECT).eq("id", id).maybeSingle(),
    fetchArticleCategories(supabase),
    fetchArticleTagSlugs(supabase, id),
  ]);

  if (!article) notFound();
  const a = article as unknown as ArticleWithAuthor;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Manage articles
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Edit article
        </h1>
        {a.published && (
          <Link
            href={`/articles/${a.slug}`}
            className="mt-1 inline-block text-sm text-brand-700 hover:underline"
          >
            View public page →
          </Link>
        )}
      </div>

      <ArticleForm
        mode="edit"
        articleId={a.id}
        initialSlug={a.slug}
        initialTitle={a.title}
        initialSummary={a.summary ?? ""}
        initialBody={a.body}
        initialReferenceList={a.reference_list ?? ""}
        initialTags={initialTags.length > 0 ? initialTags : [a.category]}
        initialPublished={a.published}
        initialCoverUrl={a.cover_image_url}
        initialPosterAvatar={a.poster_avatar ?? undefined}
        tags={tags}
        redirectTo="/admin/articles"
      />

      <div className="border-t border-line pt-4">
        <DeleteArticleButton
          articleId={a.id}
          coverImageUrl={a.cover_image_url}
          redirectTo="/admin/articles"
        />
      </div>
    </div>
  );
}
