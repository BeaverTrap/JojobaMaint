import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchContentTags,
  normalizeTagLinks,
  type ContentTag,
  type ContentTagLink,
} from "@/lib/content-tags";
import type { ArticleWithAuthor } from "@/lib/database.types";

export const ARTICLE_SELECT =
  "id, slug, title, summary, body, reference_list, category, feed_section, poster_avatar, cover_image_url, published, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export const ARTICLE_TAG_EMBED =
  ", tag_links:article_tag_links(tag_slug, content_tags(slug, label))";

export type ArticleWithTags = ArticleWithAuthor & { tags: ContentTagLink[] };

export async function fetchArticleCategories(
  supabase: SupabaseClient,
): Promise<ContentTag[]> {
  return fetchContentTags(supabase);
}

export function enrichArticle(
  row: ArticleWithAuthor & {
    tag_links?: Parameters<typeof normalizeTagLinks>[0];
  },
): ArticleWithTags {
  const { tag_links, ...rest } = row;
  return {
    ...(rest as ArticleWithAuthor),
    tags: normalizeTagLinks(tag_links),
  };
}
