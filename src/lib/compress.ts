import imageCompression from "browser-image-compression";

/**
 * Compress an image entirely in the browser before upload.
 *
 * Because the app runs on the Supabase Free Tier (1 GB storage), every image
 * is squeezed to roughly < 300 KB while keeping reasonable visual quality.
 *
 * @param file        The original File from an <input> or drop event.
 * @param maxSizeMB   Target maximum size in MB (default 0.3 MB = ~300 KB).
 * @returns           A new, compressed File (converted to WebP when possible).
 */
export async function compressImage(
  file: File,
  maxSizeMB = 0.3,
): Promise<File> {
  // Non-images (shouldn't happen given the input accept filter) pass through.
  if (!file.type.startsWith("image/")) return file;

  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1600, // plenty for phones/desktops, keeps detail
    useWebWorker: true,
    fileType: "image/webp" as const,
    initialQuality: 0.8,
  };

  try {
    const compressed = await imageCompression(file, options);

    // Rename so the extension matches the new WebP type.
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([compressed], newName, {
      type: compressed.type || "image/webp",
      lastModified: Date.now(),
    });
  } catch (err) {
    // If compression fails for any reason, fall back to the original file
    // rather than blocking the upload entirely.
    console.error("Image compression failed, uploading original:", err);
    return file;
  }
}

/** Human-readable file size, e.g. "278 KB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
