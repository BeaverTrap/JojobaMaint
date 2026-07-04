"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { STICKERS, STICKER_CATEGORIES } from "@/lib/mascot-stickers";
import type { Sticker, StickerCategory } from "@/lib/mascot-stickers";

export default function MascotStickerPicker({
  onSelect,
  onClose,
}: {
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<StickerCategory>("mascot");
  const [filter, setFilter] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const filtered = STICKERS.filter(
    (s) =>
      s.category === category &&
      (filter === "" || s.label.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
    >
      {/* Category tabs */}
      <div className="flex border-b border-line">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => { setCategory(cat.id); setFilter(""); }}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
              category === cat.id
                ? "border-b-2 border-brand-600 text-brand-700 dark:text-brand-300"
                : "text-muted hover:text-ink"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="border-b border-line px-2 py-1.5">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-md bg-hover px-2 py-1 text-xs text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto p-2">
        {filtered.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onSelect(sticker)}
            title={sticker.label}
            className="flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors hover:bg-hover active:scale-95"
          >
            <Image
              src={sticker.src}
              alt={sticker.label}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 object-contain"
            />
            <span className="max-w-full truncate text-[9px] text-muted">{sticker.label}</span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-4 py-4 text-center text-xs text-muted">No stickers found</p>
        ) : null}
      </div>
    </div>
  );
}
