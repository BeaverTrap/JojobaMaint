import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories, normalizePostRows, POST_SELECT } from "@/lib/posts";
import { postLocationLabel, postTitle } from "@/lib/post-display";
import type { PostWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const [categories, { data }] = await Promise.all([
    fetchCategories(supabase),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const posts = normalizePostRows((data ?? []) as unknown as PostWithAuthor[]);
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
            Feed posts
          </h1>
          <p className="text-sm text-muted">
            Every post appears on the public feed under All. Edit or add from
            the dashboard.
          </p>
        </div>
        <Link
          href="/admin"
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center text-sm text-muted">
          No posts yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/posts/${p.id}/edit`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{postTitle(p)}</p>
                  {postLocationLabel(p) && (
                    <p className="text-sm text-brand-700">
                      {postLocationLabel(p)}
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    {labelBySlug.get(p.category) ?? p.category} ·{" "}
                    {formatDistanceToNow(new Date(p.created_at), {
                      addSuffix: true,
                    })}
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
