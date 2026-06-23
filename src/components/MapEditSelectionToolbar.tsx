"use client";

export type MapListFilter = "all" | "on-map" | "unplaced";

type MapEditSelectionToolbarProps = {
  itemLabel: string;
  filter: MapListFilter;
  onFilterChange: (filter: MapListFilter) => void;
  placedCount: number;
  unplacedCount: number;
  selectedCount: number;
  onResetSelected: () => void;
  onResetAllOnMap: () => void;
  onClearSelection: () => void;
};

export function MapEditSelectionToolbar({
  itemLabel,
  filter,
  onFilterChange,
  placedCount,
  unplacedCount,
  selectedCount,
  onResetSelected,
  onResetAllOnMap,
  onClearSelection,
}: MapEditSelectionToolbarProps) {
  return (
    <div className="mb-2 flex flex-col gap-2 border-b border-line pb-2">
      <p className="text-[11px] leading-snug text-muted">
        Shift+click range · Ctrl+click toggle · Delete resets all selected ·{" "}
        {unplacedCount > 0
          ? `${unplacedCount} unplaced · ${placedCount} on map`
          : `${placedCount} on map`}
      </p>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["all", "All"],
            ["on-map", "On map"],
            ["unplaced", "Unplaced"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
              filter === value
                ? "bg-brand-600 text-white"
                : "border border-line text-ink hover:bg-hover"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={onResetSelected}
          className="rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100 dark:hover:bg-brand-950/60"
        >
          Reset all selected
          {selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
        <button
          type="button"
          disabled={placedCount === 0}
          onClick={onResetAllOnMap}
          className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-950/40"
        >
          Reset all {itemLabel} on map
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-hover"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
