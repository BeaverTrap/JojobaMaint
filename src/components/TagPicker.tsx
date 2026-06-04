"use client";

import type { ContentTag } from "@/lib/content-tags";

export default function TagPicker({
  tags,
  selected,
  onChange,
  label = "Tags",
  hint,
}: {
  tags: ContentTag[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  label?: string;
  hint?: string;
}) {
  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-ink">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((t) => {
          const on = selected.includes(t.slug);
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => toggle(t.slug)}
              className={
                on
                  ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {selected.length} selected — tap again to remove
        </p>
      )}
    </div>
  );
}
