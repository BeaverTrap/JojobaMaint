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

export function matchesFeedSectionFilter(
  section: FeedSection,
  filter: "all" | "maintenance" | "landscaping",
): boolean {
  if (filter === "all") return true;
  if (filter === "maintenance") {
    return section === "maintenance" || section === "both";
  }
  return section === "landscaping" || section === "both";
}
