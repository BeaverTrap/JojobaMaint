"use client";

import {
  DEFAULT_PLACE_ICON,
  getPlaceIcon,
  getPlaceMarkerClasses,
  PLACE_COLOR_OPTIONS,
  PLACE_ICON_OPTIONS,
  type PlaceIconName,
  type PlaceMarkerColor,
} from "@/lib/map-place-icons";

type PlaceStylePickerProps = {
  icon: PlaceIconName;
  color?: PlaceMarkerColor;
  onIconChange: (icon: PlaceIconName) => void;
  onColorChange: (color: PlaceMarkerColor | undefined) => void;
  showPreview?: boolean;
};

export function PlaceStylePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  showPreview = true,
}: PlaceStylePickerProps) {
  const PreviewIcon = getPlaceIcon(icon);
  const previewClasses = getPlaceMarkerClasses({ icon, color });

  return (
    <div className="flex flex-col gap-3">
      {showPreview && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full p-1.5 shadow-sm ${previewClasses}`}
          >
            <PreviewIcon className="h-4 w-4 shrink-0" />
          </span>
          <span className="text-xs text-muted">Preview</span>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Icon</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {PLACE_ICON_OPTIONS.map((opt) => {
            const Icon = getPlaceIcon(opt.value);
            const isSelected = icon === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => onIconChange(opt.value)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  isSelected
                    ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/40 dark:bg-brand-950/40"
                    : "border-line bg-page hover:bg-hover"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-ink" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Color</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            title="Auto (from icon)"
            onClick={() => onColorChange(undefined)}
            className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[10px] font-medium transition-colors ${
              color == null
                ? "border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-600/40 dark:bg-brand-950/40 dark:text-brand-200"
                : "border-line bg-page text-muted hover:bg-hover"
            }`}
          >
            Auto
          </button>
          {PLACE_COLOR_OPTIONS.map((opt) => {
            const isSelected = color === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => onColorChange(opt.value)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  opt.swatchClass
                } ${
                  isSelected
                    ? "scale-110 border-white ring-2 ring-brand-600"
                    : "border-white/80 hover:scale-105"
                }`}
                aria-label={opt.label}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
