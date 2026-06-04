import type { SupabaseClient } from "@supabase/supabase-js";
import { filterImageFiles } from "@/lib/image-accept";
import { uploadImage } from "@/lib/upload";
import { markdownImageSnippet } from "@/lib/article-images";

/** Upload many images and return markdown to insert at the cursor. */
export async function uploadInlineImageMarkdown(
  supabase: SupabaseClient,
  files: FileList | File[],
  storageFolder: string,
): Promise<{ markdown: string; uploaded: number; skipped: number }> {
  const all = Array.from(files);
  const images = filterImageFiles(all);
  const urls: string[] = [];
  for (const file of images) {
    urls.push(await uploadImage(supabase, file, storageFolder));
  }
  const markdown = urls.map((url) => markdownImageSnippet(url)).join("");
  return {
    markdown,
    uploaded: urls.length,
    skipped: all.length - images.length,
  };
}
