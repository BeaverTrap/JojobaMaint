"use client";

import { useState } from "react";
import type { NasaApod } from "@/lib/sky/types";

function formatApodDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NasaApodCard({ apod }: { apod: NasaApod }) {
  const [expanded, setExpanded] = useState(false);
  const dateLabel = formatApodDate(apod.date);

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-surface/90">
      <div className="relative bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={apod.imageUrl}
          alt={apod.title}
          loading="lazy"
          className="max-h-[26rem] w-full object-contain"
        />
        {apod.mediaType === "video" ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Video
          </span>
        ) : null}
      </div>
      <figcaption className="space-y-1 p-3">
        <p className="text-sm font-semibold text-ink">{apod.title}</p>
        <p className="text-xs text-muted">
          {dateLabel ? `${dateLabel} · ` : ""}
          NASA Astronomy Picture of the Day
          {apod.copyright ? ` · © ${apod.copyright}` : ""}
        </p>
        {apod.explanation ? (
          <>
            <p
              className={`text-xs text-muted ${expanded ? "" : "line-clamp-3"}`}
            >
              {apod.explanation}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          </>
        ) : null}
        {apod.sourceUrl ? (
          <a
            href={apod.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            {apod.mediaType === "video" ? "Watch on source →" : "View full resolution →"}
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
