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
            Maintenance and landscaping updates (quick posts and structured
            assessments), plus articles — all in one place.
          </p>
        </div>
        {isAuthorized && (
          <Link
            href="/admin"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + New
          </Link>
        )}
      </div>

      <Feed items={items} canEdit={isAuthorized} />
    </div>
  );
}
