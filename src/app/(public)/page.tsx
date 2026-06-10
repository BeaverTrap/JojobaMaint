import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import { fetchFeedItems } from "@/lib/feed";
import { parseFeedFilter } from "@/lib/feed-section";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const initialFilter = parseFeedFilter(section);
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
            Posts, guides, and assessments — filter by section below.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      <Feed
        items={items}
        canEdit={isAuthorized}
        initialFilter={initialFilter}
      />
    </div>
  );
}
