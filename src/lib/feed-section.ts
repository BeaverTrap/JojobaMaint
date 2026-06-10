export type FeedSection = "maintenance" | "landscaping" | "both";

export const FEED_SECTION_OPTIONS: { slug: FeedSection; label: string }[] = [
  { slug: "maintenance", label: "Maintenance" },
  { slug: "landscaping", label: "Landscaping" },
  { slug: "both", label: "Both" },
];

export function parseFeedSection(value: string | null | undefined): FeedSection {
  if (value === "landscaping" || value === "both") return value;
  return "maintenance";
}

export function feedSectionLabel(section: FeedSection | string): string {
  const match = FEED_SECTION_OPTIONS.find((o) => o.slug === section);
  return match?.label ?? "Maintenance";
}

export type FeedFilter = "all" | "maintenance" | "landscaping";

export function parseFeedFilter(
  value: string | null | undefined,
): FeedFilter {
  if (value === "maintenance" || value === "landscaping") return value;
  return "all";
}

export function matchesFeedSectionFilter(
  section: FeedSection,
  filter: FeedFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "maintenance") {
    return section === "maintenance" || section === "both";
  }
  return section === "landscaping" || section === "both";
}
