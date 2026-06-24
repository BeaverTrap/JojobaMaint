import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Feed from "@/components/Feed";
import PageMascotHeading from "@/components/PageMascotHeading";
import { fetchFeedItems } from "@/lib/feed";
import { parseFeedFilter } from "@/lib/feed-section";
import type { MascotSceneId } from "@/lib/mascot-scenes";

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

  const feedScene: MascotSceneId =
    initialFilter === "maintenance"
      ? "tools"
      : initialFilter === "landscaping"
        ? "reading"
        : "welcome";

  return (
    <div className="space-y-6">
      <PageMascotHeading
        scene={feedScene}
        title="Feed"
        description="Posts, guides, and assessments — filter by section below."
      >
        {isAuthorized && (
          <Link
            href="/admin"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + New
          </Link>
        )}
      </PageMascotHeading>

      <Feed
        items={items}
        canEdit={isAuthorized}
        initialFilter={initialFilter}
      />
    </div>
  );
}
