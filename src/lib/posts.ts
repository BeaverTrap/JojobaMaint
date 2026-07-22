import type { SupabaseClient } from "@supabase/supabase-js";
import type { Post, PostCategory, PostWithAuthor } from "@/lib/database.types";

type PostParent = Pick<Post, "id" | "title" | "description">;

/** PostgREST may return `parent: []` when parent_post_id is null. */
export function normalizePostRow(row: PostWithAuthor): PostWithAuthor {
  const raw = row.parent as PostParent | PostParent[] | null | undefined;
  let parent: PostParent | null = null;
  if (Array.isArray(raw)) {
    parent = raw[0] ?? null;
  } else if (raw) {
    parent = raw;
  }
  return { ...row, parent };
}

export function normalizePostRows(rows: PostWithAuthor[]): PostWithAuthor[] {
  return rows.map(normalizePostRow);
}

// Shared PostgREST select for a post with its author, images, and parent link.
export const POST_SELECT =
  "id, author_id, poster_avatar, title, body, description, image_url, category, parent_post_id, " +
  "site_number, common_area, published, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url), " +
  "images:post_images(id, image_url, position), " +
  "parent:posts!parent_post_id(id, title, description)";

export async function fetchCategories(
  supabase: SupabaseClient,
): Promise<PostCategory[]> {
  const { data } = await supabase
    .from("post_categories")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as PostCategory[];
}
