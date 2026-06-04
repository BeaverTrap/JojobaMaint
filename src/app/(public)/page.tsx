import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import { normalizePostRows, POST_SELECT } from "@/lib/posts";
import type { PostWithAuthor, PostCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [{ data }, { data: cats }] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("post_categories")
      .select("slug, label, position")
      .order("position", { ascending: true }),
  ]);

  const posts = normalizePostRows((data ?? []) as unknown as PostWithAuthor[]);
  const categories = (cats ?? []) as PostCategory[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Feed</h1>
          <p className="text-sm text-muted">
            All logged jobs in one place — maintenance, landscaping, pond,
            projects, and more. Use section tabs to filter.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + New post
          </Link>
        )}
      </div>

      <Feed
        initialPosts={posts}
        categories={categories}
        canEdit={isAuthorized}
      />
    </div>
  );
}
