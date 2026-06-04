import type { SupabaseClient } from "@supabase/supabase-js";
import { ARTICLE_SELECT } from "@/lib/articles";
import { assessmentLocationLine } from "@/lib/tree-assessment-display";
import { maintenanceLocationLine } from "@/lib/maintenance-assessment-display";
import { normalizePostRows, POST_SELECT } from "@/lib/posts";
import { postBody, postLocationLabel, postTitle } from "@/lib/post-display";
import { postImageUrls } from "@/lib/database.types";
import type {
  ArticleWithAuthor,
  MaintenanceAssessmentWithAuthor,
  PostWithAuthor,
  TreeAssessmentWithAuthor,
} from "@/lib/database.types";
import {
  MAINTENANCE_ASSESSMENT_SELECT,
} from "@/lib/maintenance-assessments";
import { TREE_ASSESSMENT_SELECT } from "@/lib/tree-assessments";

export type FeedItemKind =
  | "maintenance"
  | "landscaping"
  | "article"
  | "tree-assessment"
  | "maintenance-assessment";

export type FeedItem = {
  id: string;
  kind: FeedItemKind;
  kindLabel: string;
  title: string;
  summary: string | null;
  href: string;
  editHref: string | null;
  coverImageUrl: string | null;
  imageUrls: string[];
  authorName: string;
  authorAvatar: string | null;
  sortAt: string;
  locationLine: string | null;
  isDraft: boolean;
  /** Original post row when kind is maintenance or landscaping */
  post?: PostWithAuthor;
};

export type FeedFilter =
  | "all"
  | "maintenance"
  | "landscaping"
  | "article"
  | "assessment";

export async function fetchFeedItems(
  supabase: SupabaseClient,
  options: { includeUnpublished: boolean },
): Promise<FeedItem[]> {
  const { includeUnpublished } = options;
  const items: FeedItem[] = [];

  const postQuery = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);

  const articleQuery = supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!includeUnpublished) articleQuery.eq("published", true);

  const treeQuery = supabase
    .from("tree_assessments")
    .select(TREE_ASSESSMENT_SELECT)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!includeUnpublished) treeQuery.eq("published", true);

  const maintQuery = supabase
    .from("maintenance_assessments")
    .select(MAINTENANCE_ASSESSMENT_SELECT)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!includeUnpublished) maintQuery.eq("published", true);

  const [
    { data: posts },
    { data: articles },
    { data: trees },
    { data: maint },
  ] = await Promise.all([postQuery, articleQuery, treeQuery, maintQuery]);

  for (const row of normalizePostRows(
    (posts ?? []) as unknown as PostWithAuthor[],
  )) {
    const kind: FeedItemKind =
      row.category === "landscaping" ? "landscaping" : "maintenance";
    items.push({
      id: `post-${row.id}`,
      kind,
      kindLabel: kind === "landscaping" ? "Landscaping" : "Maintenance",
      title: postTitle(row),
      summary: postBody(row) || row.description || null,
      href: `/posts/${row.id}`,
      editHref: `/admin/posts/${row.id}/edit`,
      coverImageUrl: postImageUrls(row)[0] ?? null,
      imageUrls: postImageUrls(row),
      authorName: row.author?.display_name ?? "Team member",
      authorAvatar: row.author?.avatar_url ?? null,
      sortAt: row.created_at,
      locationLine: postLocationLabel(row),
      isDraft: false,
      post: row,
    });
  }

  for (const row of (articles ?? []) as unknown as ArticleWithAuthor[]) {
    items.push({
      id: `article-${row.id}`,
      kind: "article",
      kindLabel: "Article",
      title: row.title,
      summary: row.summary,
      href: `/articles/${row.slug}`,
      editHref: `/admin/articles/${row.id}/edit`,
      coverImageUrl: row.cover_image_url,
      imageUrls: row.cover_image_url ? [row.cover_image_url] : [],
      authorName: row.author?.display_name ?? "Team member",
      authorAvatar: row.author?.avatar_url ?? null,
      sortAt: row.updated_at,
      locationLine: null,
      isDraft: !row.published,
    });
  }

  for (const row of (trees ?? []) as unknown as TreeAssessmentWithAuthor[]) {
    items.push({
      id: `tree-${row.id}`,
      kind: "tree-assessment",
      kindLabel: "Landscaping assessment",
      title: row.title,
      summary: row.summary,
      href: `/tree-assessments/${row.slug}`,
      editHref: `/admin/tree-assessments/${row.id}/edit`,
      coverImageUrl: row.cover_image_url,
      imageUrls: row.cover_image_url ? [row.cover_image_url] : [],
      authorName: row.author?.display_name ?? "Team member",
      authorAvatar: row.author?.avatar_url ?? null,
      sortAt: row.updated_at,
      locationLine: assessmentLocationLine(row),
      isDraft: !row.published,
    });
  }

  for (const row of (maint ?? []) as unknown as MaintenanceAssessmentWithAuthor[]) {
    items.push({
      id: `maint-${row.id}`,
      kind: "maintenance-assessment",
      kindLabel: "Maintenance assessment",
      title: row.title,
      summary: row.summary,
      href: `/maintenance-assessments/${row.slug}`,
      editHref: `/admin/maintenance-assessments/${row.id}/edit`,
      coverImageUrl: row.cover_image_url,
      imageUrls: row.cover_image_url ? [row.cover_image_url] : [],
      authorName: row.author?.display_name ?? "Team member",
      authorAvatar: row.author?.avatar_url ?? null,
      sortAt: row.updated_at,
      locationLine: maintenanceLocationLine(row),
      isDraft: !row.published,
    });
  }

  items.sort(
    (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
  );

  return items;
}

export function filterFeedItems(
  items: FeedItem[],
  filter: FeedFilter,
  query: string,
): FeedItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "maintenance" &&
        (item.kind === "maintenance" ||
          item.kind === "maintenance-assessment")) ||
      (filter === "landscaping" &&
        (item.kind === "landscaping" || item.kind === "tree-assessment")) ||
      (filter === "article" && item.kind === "article") ||
      (filter === "assessment" &&
        (item.kind === "tree-assessment" ||
          item.kind === "maintenance-assessment"));

    const haystack = [
      item.title,
      item.summary,
      item.locationLine,
      item.kindLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !q || haystack.includes(q);
    return matchesFilter && matchesQuery;
  });
}
