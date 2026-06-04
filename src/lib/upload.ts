import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/compress";

const BUCKET = "images";

/**
 * Compress an image and upload it to the public `images` bucket.
 * Returns the public URL of the stored object.
 *
 * @param supabase  A browser Supabase client.
 * @param file      The original file selected by the user.
 * @param folder    Logical subfolder, e.g. "posts" or "articles/my-slug".
 */
export async function uploadImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<string> {
  const compressed = await compressImage(file);

  const ext = compressed.name.split(".").pop() || "webp";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: false,
      contentType: compressed.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an image from the `images` bucket given its public URL.
 * Best-effort: silently ignores URLs that don't point at the bucket.
 */
export async function deleteImageByUrl(
  supabase: SupabaseClient,
  url: string,
): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
