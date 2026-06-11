"use client";

import type { ArticlePickerItem } from "@/lib/articles";

function articleLabel(a: ArticlePickerItem): string {
  const title = a.title.trim();
  if (title.length <= 70) return title;
  return title.slice(0, 70) + "…";
}

export default function RelatedArticlePicker({
  articles,
  selected,
  onChange,
}: {
  articles: ArticlePickerItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted">
        No other articles yet — save this one first, then link related guides
        here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
        {articles.map((a) => {
          const on = selected.includes(a.id);
          return (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-hover"
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(a.id)}
                className="mt-0.5 rounded border-line text-brand-600 focus:ring-brand-400"
              />
              <span className="min-w-0 text-sm text-ink">
                <span className="font-medium">{articleLabel(a)}</span>
                {a.summary?.trim() && (
                  <span className="mt-0.5 block text-xs text-muted">
                    {a.summary.trim()}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted">
          {selected.length} related article{selected.length === 1 ? "" : "s"}{" "}
          selected
        </p>
      )}
    </div>
  );
}
