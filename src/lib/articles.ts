import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchContentTags,
  normalizeTagLinks,
  type ContentTag,
  type ContentTagLink,
} from "@/lib/content-tags";
import type { ArticleWithAuthor } from "@/lib/database.types";

export const ARTICLE_SELECT =
  "id, slug, title, summary, body, reference_list, category, feed_section, poster_avatar, cover_image_url, site_number, common_area, published, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export const ARTICLE_TAG_EMBED =
  ", tag_links:article_tag_links(tag_slug, content_tags(slug, label))";

export const ARTICLE_RELATED_EMBED =
  ", related_links:article_related_links(related_article:articles!related_article_id(id, slug, title, summary))";

export type RelatedArticleSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
};

export type ArticlePickerItem = RelatedArticleSummary;

export type ArticleWithTags = ArticleWithAuthor & { tags: ContentTagLink[] };

export type ArticleWithTagsAndRelated = ArticleWithTags & {
  relatedArticles: RelatedArticleSummary[];
};

export async function fetchArticleCategories(
  supabase: SupabaseClient,
): Promise<ContentTag[]> {
  return fetchContentTags(supabase);
}

function normalizeRelatedLinks(
  raw:
    | {
        related_article:
          | RelatedArticleSummary
          | RelatedArticleSummary[]
          | null;
      }[]
    | null
    | undefined,
): RelatedArticleSummary[] {
  if (!raw?.length) return [];
  const out: RelatedArticleSummary[] = [];
  for (const row of raw) {
    const rel = row.related_article;
    if (Array.isArray(rel)) {
      const item = rel[0];
      if (item) out.push(item);
    } else if (rel) {
      out.push(rel);
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

export function enrichArticle(
  row: ArticleWithAuthor & {
    tag_links?: Parameters<typeof normalizeTagLinks>[0];
    related_links?: Parameters<typeof normalizeRelatedLinks>[0];
  },
): ArticleWithTagsAndRelated {
  const { tag_links, related_links, ...rest } = row;
  return {
    ...(rest as ArticleWithAuthor),
    tags: normalizeTagLinks(tag_links),
    relatedArticles: normalizeRelatedLinks(related_links),
  };
}

export async function fetchArticleRelatedIds(
  supabase: SupabaseClient,
  articleId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("article_related_links")
    .select("related_article_id")
    .eq("article_id", articleId);

  if (error) throw error;
  return (data ?? []).map((r) => r.related_article_id as string);
}

export async function syncArticleRelatedLinks(
  supabase: SupabaseClient,
  articleId: string,
  relatedIds: string[],
): Promise<void> {
  const unique = [
    ...new Set(relatedIds.filter((id) => id && id !== articleId)),
  ];
  const { error: delErr } = await supabase
    .from("article_related_links")
    .delete()
    .eq("article_id", articleId);
  if (delErr) throw delErr;
  if (unique.length === 0) return;
  const rows = unique.map((related_article_id) => ({
    article_id: articleId,
    related_article_id,
  }));
  const { error: insErr } = await supabase
    .from("article_related_links")
    .insert(rows);
  if (insErr) throw insErr;
}

export async function fetchRecentArticlesForPicker(
  supabase: SupabaseClient,
  excludeArticleId?: string,
  limit = 50,
): Promise<ArticlePickerItem[]> {
  let query = supabase
    .from("articles")
    .select("id, slug, title, summary")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (excludeArticleId) {
    query = query.neq("id", excludeArticleId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ArticlePickerItem[];
}

export function isRelatedLinksSchemaError(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : String(err);
  return (
    msg.includes("article_related_links") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}
