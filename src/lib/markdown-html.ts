import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

/** Render stored markdown for the rich-text editor surface. */
export function markdownToHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return "";
  return marked.parse(trimmed, { async: false }) as string;
}
