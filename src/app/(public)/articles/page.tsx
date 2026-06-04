import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchArticleCategories, ARTICLE_SELECT } from "@/lib/articles";
import ArticlesIndex from "@/components/ArticlesIndex";
import type { ArticleWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [categories, { data }] = await Promise.all([
    fetchArticleCategories(supabase),
    supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("published", true)
      .order("updated_at", { ascending: false }),
  ]);

  // Staff preview: include drafts when authorized (RLS allows).
  let articles = (data ?? []) as unknown as ArticleWithAuthor[];
  if (isAuthorized) {
    const { data: all } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .order("updated_at", { ascending: false });
    articles = (all ?? []) as unknown as ArticleWithAuthor[];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Articles &amp; guides
          </h1>
          <p className="text-sm text-muted">
            Tree care, best practices, and park knowledge — separate from the
            daily job feed.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin/articles"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Manage articles
          </Link>
        )}
      </div>

      <ArticlesIndex
        articles={articles}
        categories={categories}
        canEdit={isAuthorized}
      />
    </div>
  );
}
