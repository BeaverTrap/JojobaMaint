import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import { fetchFeedItems } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const items = await fetchFeedItems(supabase, {
    includeUnpublished: isAuthorized,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Feed</h1>
          <p className="text-sm text-muted">
            Log posts, guides, and assessments in one place.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/schedule"
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:bg-hover"
          >
            Schedule
          </Link>
          {isAuthorized && (
            <Link
              href="/admin"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              + New
            </Link>
          )}
        </div>
      </div>

      <Feed items={items} canEdit={isAuthorized} />
    </div>
  );
}
