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

/** Shown when `content_tags` table is not migrated yet — matches migration seed. */
export const BUILTIN_CONTENT_TAGS: ContentTag[] = [
  { slug: "trees", label: "Trees", position: 10 },
  { slug: "pruning", label: "Pruning & trimming", position: 11 },
  { slug: "removal", label: "Tree removal", position: 12 },
  { slug: "planting", label: "Planting", position: 13 },
  { slug: "pest-disease", label: "Pest & disease", position: 14 },
  { slug: "irrigation", label: "Irrigation", position: 15 },
  { slug: "park-grounds", label: "Park & grounds", position: 16 },
  { slug: "landscaping", label: "Landscaping / grounds", position: 17 },
  { slug: "plumbing", label: "Plumbing", position: 20 },
  { slug: "electrical", label: "Electrical", position: 21 },
  { slug: "hvac", label: "HVAC", position: 22 },
  { slug: "buildings", label: "Buildings & halls", position: 23 },
  { slug: "roads-paving", label: "Roads & paving", position: 24 },
  { slug: "pond", label: "Pond", position: 25 },
  { slug: "pool-spa", label: "Pool / spa", position: 26 },
  { slug: "big-project", label: "Big project", position: 27 },
  { slug: "cross-connection", label: "Cross-connection", position: 28 },
  { slug: "equipment", label: "Equipment & rentals", position: 29 },
  { slug: "safety", label: "Safety", position: 30 },
  { slug: "utilities", label: "Utilities", position: 31 },
  { slug: "waste-cleanup", label: "Waste & cleanup", position: 32 },
  { slug: "best-practices", label: "Best practices", position: 40 },
  { slug: "how-to", label: "How-to / guide", position: 41 },
  { slug: "policy", label: "Policy & rules", position: 42 },
  { slug: "resident-inquiry", label: "Resident inquiry", position: 50 },
  { slug: "damage", label: "Damage", position: 51 },
  { slug: "inspection", label: "Inspection", position: 52 },
  { slug: "routine", label: "Routine upkeep", position: 53 },
  { slug: "scheduled", label: "Scheduled work", position: 54 },
  { slug: "project-update", label: "Project update", position: 55 },
  { slug: "monitoring", label: "Monitoring", position: 56 },
  { slug: "health", label: "Health assessment", position: 57 },
  { slug: "general", label: "General maintenance", position: 58 },
  { slug: "other", label: "Other", position: 99 },
];

async function fetchLegacyCategoryTables(
  supabase: SupabaseClient,
): Promise<ContentTag[]> {
  const bySlug = new Map<string, ContentTag>();

  const sources = await Promise.all([
    supabase
      .from("article_categories")
      .select(TAG_SELECT)
      .order("position", { ascending: true }),
    supabase
      .from("post_categories")
      .select(TAG_SELECT)
      .order("position", { ascending: true }),
  ]);

  for (const { data } of sources) {
    for (const row of (data ?? []) as ContentTag[]) {
      if (!bySlug.has(row.slug)) bySlug.set(row.slug, row);
    }
  }

  return [...bySlug.values()].sort((a, b) => a.position - b.position);
}

export async function fetchContentTags(
  supabase: SupabaseClient,
): Promise<ContentTag[]> {
  const { data, error } = await supabase
    .from("content_tags")
    .select(TAG_SELECT)
    .order("position", { ascending: true });

  if (!error && data && data.length > 0) {
    return data as ContentTag[];
  }

  const legacy = await fetchLegacyCategoryTables(supabase);
  if (legacy.length > 0) return legacy;

  return BUILTIN_CONTENT_TAGS;
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
  const { data, error } = await supabase
    .from("article_tag_links")
    .select("tag_slug")
    .eq("article_id", articleId);

  if (!error && data && data.length > 0) {
    return data.map((r) => r.tag_slug as string);
  }

  const { data: article } = await supabase
    .from("articles")
    .select("category")
    .eq("id", articleId)
    .maybeSingle();

  return article?.category ? [article.category] : [];
}

export async function fetchPostTagSlugs(
  supabase: SupabaseClient,
  postId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("post_tag_links")
    .select("tag_slug")
    .eq("post_id", postId);

  if (!error && data && data.length > 0) {
    return data.map((r) => r.tag_slug as string);
  }
  return [];
}

export async function fetchTreeAssessmentTagSlugs(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tree_assessment_tag_links")
    .select("tag_slug")
    .eq("assessment_id", assessmentId);

  if (!error && data && data.length > 0) {
    return data.map((r) => r.tag_slug as string);
  }
  return [];
}

export async function fetchMaintenanceAssessmentTagSlugs(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("maintenance_assessment_tag_links")
    .select("tag_slug")
    .eq("assessment_id", assessmentId);

  if (!error && data && data.length > 0) {
    return data.map((r) => r.tag_slug as string);
  }
  return [];
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

/** User-facing message when tag link tables are missing. */
export function isTagsSchemaError(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : String(err);
  return (
    msg.includes("article_tag_links") ||
    msg.includes("content_tags") ||
    msg.includes("post_tag_links") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}
