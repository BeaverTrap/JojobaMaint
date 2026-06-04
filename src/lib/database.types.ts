// Hand-written types that mirror the SQL migration in supabase/migrations.
// If you change the schema, you can regenerate these with:
//   supabase gen types typescript --local > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_authorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedEmail {
  email: string;
  note: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  body: string;
  description: string;
  image_url: string | null;
  category: string;
  parent_post_id: string | null;
  site_number: string | null;
  common_area: string | null;
  created_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  position: number;
  created_at: string;
}

export interface PostCategory {
  slug: string;
  label: string;
  position: number;
}

// Convenience shapes for joined queries used in the UI.
export type PostAuthor = Pick<Profile, "id" | "display_name" | "avatar_url">;

export type PostWithAuthor = Post & {
  author: PostAuthor | null;
  images: Pick<PostImage, "id" | "image_url" | "position">[];
  parent: Pick<Post, "id" | "title" | "description"> | null;
};

// All image URLs for a post, combining the legacy single image_url (older
// posts) with the post_images rows, ordered by position.
export function postImageUrls(post: {
  image_url: string | null;
  images?: Pick<PostImage, "image_url" | "position">[] | null;
}): string[] {
  const fromTable = (post.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.image_url);
  return post.image_url ? [post.image_url, ...fromTable] : fromTable;
}

export interface ArticleCategory {
  slug: string;
  label: string;
  position: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  reference_list: string | null;
  category: string;
  cover_image_url: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export type ArticleWithAuthor = Article & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export interface TreeAssessmentConcern {
  slug: string;
  label: string;
  position: number;
}

export interface TreeAssessment {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  reference_list: string | null;
  site_number: string;
  tree_description: string;
  plant_type: string | null;
  concern_type: string;
  resident_note: string | null;
  cover_image_url: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export type TreeAssessmentWithAuthor = TreeAssessment & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export const PLANT_TYPE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "tree", label: "Tree" },
  { value: "shrub", label: "Shrub" },
  { value: "palm", label: "Palm" },
  { value: "cactus", label: "Cactus / succulent" },
  { value: "other", label: "Other plant" },
] as const;
