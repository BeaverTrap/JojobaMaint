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
  description: string;
  image_url: string | null;
  created_at: string;
}

export interface Gallery {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  gallery_id: string;
  image_url: string;
  created_at: string;
}

// Convenience shapes for joined queries used in the UI.
export type PostWithAuthor = Post & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export type GalleryWithMeta = Gallery & {
  author: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
  image_count: number;
  cover_image_url: string | null;
};
