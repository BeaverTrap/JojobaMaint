import { FEED_SECTION_OPTIONS, type FeedSection } from "@/lib/feed-section";

export default function FeedSectionPicker({
  value,
  onChange,
}: {
  value: FeedSection;
  onChange: (section: FeedSection) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FEED_SECTION_OPTIONS.map((option) => (
        <button
          key={option.slug}
          type="button"
          onClick={() => onChange(option.slug)}
          className={
            value === option.slug
              ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
              : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
