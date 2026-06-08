import {
  feedSectionLabel,
  parseFeedSection,
  type FeedSection,
} from "@/lib/feed-section";

export default function FeedSectionBadge({
  section,
}: {
  section: FeedSection | string;
}) {
  const parsed = parseFeedSection(section);
  const label = feedSectionLabel(parsed);

  return (
    <span
      className={
        parsed === "landscaping"
          ? "inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/70 dark:text-brand-200"
          : parsed === "both"
            ? "inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-ink dark:bg-brand-950/60 dark:text-brand-200"
            : "inline-flex rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/40 dark:text-brand-200 dark:ring-brand-800"
      }
    >
      {label}
    </span>
  );
}
