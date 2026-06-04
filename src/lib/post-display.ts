import type { Post, PostCategory } from "@/lib/database.types";

export function postCategoryLabel(
  category: string,
  categories?: Pick<PostCategory, "slug" | "label">[],
): string {
  const match = categories?.find((c) => c.slug === category);
  if (match) return match.label;
  if (category === "landscaping") return "Landscaping";
  return "Maintenance";
}

/** Headline for cards, detail, and continuation links (falls back to legacy description). */
export function postTitle(post: Pick<Post, "title" | "description">): string {
  const t = post.title?.trim();
  return t || post.description.trim();
}

export function postBody(post: Pick<Post, "body" | "description" | "title">): string {
  const b = post.body?.trim();
  if (b) return b;
  const t = post.title?.trim();
  const d = post.description.trim();
  if (t && d.startsWith(t)) {
    const rest = d.slice(t.length).replace(/^\s*\n+/, "").trim();
    return rest;
  }
  return "";
}

export function postLocationLabel(
  post: Pick<Post, "site_number" | "common_area">,
): string | null {
  const site = post.site_number?.trim();
  const area = post.common_area?.trim();
  if (site && area) return `Site ${site} · ${area}`;
  if (site) return `Site ${site}`;
  if (area) return area;
  return null;
}

/** Keeps legacy description in sync for search and older rows. */
export function buildPostDescription(title: string, body: string): string {
  const t = title.trim();
  const b = body.trim();
  return b ? `${t}\n\n${b}` : t;
}
