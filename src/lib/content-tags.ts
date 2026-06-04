import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentTag = {
  slug: string;
  label: string;
  position: number;
};

export type ContentTagLink = {
  slug: string;
  label: string;
};

const TAG_SELECT = "slug, label, position";

export async function fetchContentTags(
  supabase: SupabaseClient,
): Promise<ContentTag[]> {
  const { data } = await supabase
    .from("content_tags")
    .select(TAG_SELECT)
    .order("position", { ascending: true });
  return (data ?? []) as ContentTag[];
}

export function normalizeTagLinks(
  raw: { tag_slug: string; content_tags: ContentTagLink | ContentTagLink[] | null }[] | null | undefined,
): ContentTagLink[] {
  if (!raw?.length) return [];
  const out: ContentTagLink[] = [];
  for (const row of raw) {
    const tag = row.content_tags;
    if (Array.isArray(tag)) {
      const t = tag[0];
      if (t) out.push({ slug: t.slug, label: t.label });
    } else if (tag) {
      out.push({ slug: tag.slug, label: tag.label });
    } else if (row.tag_slug) {
      out.push({ slug: row.tag_slug, label: row.tag_slug });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export async function fetchArticleTagSlugs(
  supabase: SupabaseClient,
  articleId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("article_tag_links")
    .select("tag_slug")
    .eq("article_id", articleId);
  return (data ?? []).map((r) => r.tag_slug as string);
}

export async function fetchPostTagSlugs(
  supabase: SupabaseClient,
  postId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("post_tag_links")
    .select("tag_slug")
    .eq("post_id", postId);
  return (data ?? []).map((r) => r.tag_slug as string);
}

export async function fetchTreeAssessmentTagSlugs(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("tree_assessment_tag_links")
    .select("tag_slug")
    .eq("assessment_id", assessmentId);
  return (data ?? []).map((r) => r.tag_slug as string);
}

export async function fetchMaintenanceAssessmentTagSlugs(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("maintenance_assessment_tag_links")
    .select("tag_slug")
    .eq("assessment_id", assessmentId);
  return (data ?? []).map((r) => r.tag_slug as string);
}

async function replaceTagLinks(
  supabase: SupabaseClient,
  table:
    | "article_tag_links"
    | "post_tag_links"
    | "tree_assessment_tag_links"
    | "maintenance_assessment_tag_links",
  idColumn: string,
  id: string,
  tagSlugs: string[],
): Promise<void> {
  const unique = [...new Set(tagSlugs.filter(Boolean))];
  const { error: delErr } = await supabase.from(table).delete().eq(idColumn, id);
  if (delErr) throw delErr;
  if (unique.length === 0) return;
  const rows = unique.map((tag_slug) => ({ [idColumn]: id, tag_slug }));
  const { error: insErr } = await supabase.from(table).insert(rows);
  if (insErr) throw insErr;
}

export function syncArticleTags(
  supabase: SupabaseClient,
  articleId: string,
  tagSlugs: string[],
) {
  return replaceTagLinks(
    supabase,
    "article_tag_links",
    "article_id",
    articleId,
    tagSlugs,
  );
}

export function syncPostTags(
  supabase: SupabaseClient,
  postId: string,
  tagSlugs: string[],
) {
  return replaceTagLinks(supabase, "post_tag_links", "post_id", postId, tagSlugs);
}

export function syncTreeAssessmentTags(
  supabase: SupabaseClient,
  assessmentId: string,
  tagSlugs: string[],
) {
  return replaceTagLinks(
    supabase,
    "tree_assessment_tag_links",
    "assessment_id",
    assessmentId,
    tagSlugs,
  );
}

export function syncMaintenanceAssessmentTags(
  supabase: SupabaseClient,
  assessmentId: string,
  tagSlugs: string[],
) {
  return replaceTagLinks(
    supabase,
    "maintenance_assessment_tag_links",
    "assessment_id",
    assessmentId,
    tagSlugs,
  );
}

/** Legacy articles.category column — first tag or fallback. */
export function primaryTagSlug(tagSlugs: string[], fallback = "trees"): string {
  return tagSlugs[0] ?? fallback;
}
