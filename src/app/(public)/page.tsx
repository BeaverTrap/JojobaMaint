import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import type { PostWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, author_id, description, image_url, created_at, author:profiles(id, display_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const posts = (data ?? []) as unknown as PostWithAuthor[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Maintenance Feed
          </h1>
          <p className="text-sm text-muted">
            Documenting the work that keeps Jojoba Hills running.
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

      <Feed initialPosts={posts} />
    </div>
  );
}
