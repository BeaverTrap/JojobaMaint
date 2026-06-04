import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostCategory } from "@/lib/database.types";

// Shared PostgREST select for a post with its author, images, and parent link.
export const POST_SELECT =
  "id, author_id, description, image_url, category, parent_post_id, created_at, " +
  "author:profiles(id, display_name, avatar_url), " +
  "images:post_images(id, image_url, position), " +
  "parent:posts!posts_parent_post_id_fkey(id, description)";

export async function fetchCategories(
  supabase: SupabaseClient,
): Promise<PostCategory[]> {
  const { data } = await supabase
    .from("post_categories")
    .select("slug, label, position")
    .order("position", { ascending: true });
  return (data ?? []) as PostCategory[];
}
