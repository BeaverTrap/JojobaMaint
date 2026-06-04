import type { ContentTagLink } from "@/lib/content-tags";

export default function ContentTagList({
  tags,
  className = "",
}: {
  tags: ContentTagLink[];
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <span
          key={t.slug}
          className="rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-muted"
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
