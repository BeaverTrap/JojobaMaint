import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleCategory } from "@/lib/database.types";

export const ARTICLE_SELECT =
  "id, slug, title, summary, body, reference_list, category, cover_image_url, published, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export async function fetchArticleCategories(
  supabase: SupabaseClient,
): Promise<ArticleCategory[]> {
  const { data } = await supabase
    .from("article_categories")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as ArticleCategory[];
}
