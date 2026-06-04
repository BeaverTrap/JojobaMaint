/** URL-safe slug from a title (ASCII letters, numbers, hyphens). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Ensure uniqueness by appending a short suffix when needed. */
export function slugWithSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, 72);
  return `${trimmed}-${suffix}`;
}
