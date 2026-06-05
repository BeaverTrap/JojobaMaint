import Link from "next/link";
import { formatPostedEditedLines } from "@/lib/content-dates";
import { createClient } from "@/lib/supabase/server";
import { fetchArticleCategories, ARTICLE_SELECT } from "@/lib/articles";
import type { ArticleWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const [categories, { data }] = await Promise.all([
    fetchArticleCategories(supabase),
    supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .order("updated_at", { ascending: false }),
  ]);

  const articles = (data ?? []) as unknown as ArticleWithAuthor[];
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Manage articles
          </h1>
          <p className="text-sm text-muted">
            Paste guides from Google Docs. Publish when ready.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          + New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No articles yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/articles/${a.id}/edit`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-xs text-muted">
                    {labelBySlug.get(a.category)} ·{" "}
                    {a.published ? "Published" : "Draft"} ·{" "}
                    {formatPostedEditedLines(a.created_at, a.updated_at).join(
                      " · ",
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-brand-700">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
