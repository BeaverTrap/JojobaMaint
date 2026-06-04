import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ARTICLE_SELECT,
  ARTICLE_TAG_EMBED,
  enrichArticle,
  fetchArticleCategories,
} from "@/lib/articles";
import ArticlesIndex from "@/components/ArticlesIndex";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const select = ARTICLE_SELECT + ARTICLE_TAG_EMBED;
  const [tags, { data }] = await Promise.all([
    fetchArticleCategories(supabase),
    supabase
      .from("articles")
      .select(select)
      .eq("published", true)
      .order("updated_at", { ascending: false }),
  ]);

  let articles = ((data ?? []) as unknown[]).map((row) =>
    enrichArticle(row as Parameters<typeof enrichArticle>[0]),
  );
  if (isAuthorized) {
    const { data: all } = await supabase
      .from("articles")
      .select(select)
      .order("updated_at", { ascending: false });
    articles = ((all ?? []) as unknown[]).map((row) =>
      enrichArticle(row as Parameters<typeof enrichArticle>[0]),
    );
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

      <ArticlesIndex articles={articles} tags={tags} canEdit={isAuthorized} />
    </div>
  );
}
