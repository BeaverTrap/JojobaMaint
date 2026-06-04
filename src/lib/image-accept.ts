/** Gallery picker on Android — keep this simple; long MIME lists can break multi-select. */
export const IMAGE_FILE_ACCEPT = "image/*";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i;

/** Client-side check when accept is omitted or the OS reports an empty MIME type. */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function filterImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(isImageFile);
}
