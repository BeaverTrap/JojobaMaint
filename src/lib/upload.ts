import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/compress";

const BUCKET = "images";

/**
 * Compress an image and upload it to the public `images` bucket.
 * Returns the public URL of the stored object.
 *
 * @param supabase  A browser Supabase client.
 * @param file      The original file selected by the user.
 * @param folder    Logical subfolder, e.g. "posts" or `gallery/<id>`.
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
