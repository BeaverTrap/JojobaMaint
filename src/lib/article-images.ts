/** Markdown block inserted at the cursor in article body text. */
export function markdownImageSnippet(url: string, alt = "Photo"): string {
  const safeAlt = alt.replace(/[\[\]]/g, "");
  return `\n\n![${safeAlt}](${url})\n\n`;
}

/** Storage folder for an article's uploads (cover + inline body images). */
export function articleStorageFolder(slug: string): string {
  return `articles/${slug}`;
}
