"use client";

import { useState } from "react";
import { MdExpandMore, MdPlayCircle } from "react-icons/md";
import { formatLaunchWindow } from "@/lib/sky/launches";
import type { VandenbergLaunch } from "@/lib/sky/types";

function launchHintClass(hint: VandenbergLaunch["viewingHint"]): string {
  switch (hint) {
    case "good":
      return "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-100";
    case "maybe":
      return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
    case "unlikely":
      return "bg-surface text-muted ring-1 ring-line";
    case "unknown":
      return "bg-surface text-muted ring-1 ring-line";
    default: {
      const _exhaustive: never = hint;
      return _exhaustive;
    }
  }
}

function launchHintLabel(hint: VandenbergLaunch["viewingHint"]): string {
  switch (hint) {
    case "good":
      return "Good chance";
    case "maybe":
      return "Maybe";
    case "unlikely":
      return "Unlikely";
    case "unknown":
      return "TBD";
    default: {
      const _exhaustive: never = hint;
      return _exhaustive;
    }
  }
}

function LaunchImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-line bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-36 w-full object-cover sm:h-44"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function LaunchCard({
  launch,
  featured = false,
}: {
  launch: VandenbergLaunch;
  featured?: boolean;
}) {
  return (
    <li className="rounded-xl border border-line bg-surface/90 p-3">
      {featured && launch.imageUrl ? (
        <LaunchImage src={launch.imageUrl} alt={launch.name} />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{launch.name}</p>
          <p className="text-xs text-muted">
            {launch.provider} · {launch.padName} · {launch.status}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${launchHintClass(launch.viewingHint)}`}
        >
          {launchHintLabel(launch.viewingHint)}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink">
        {formatLaunchWindow(launch.windowStart, launch.windowEnd)}
      </p>
      <p className="mt-1 text-xs text-muted">{launch.viewingNote}</p>
      {featured && launch.missionDescription ? (
        <p className="mt-2 line-clamp-3 text-xs text-muted">
          {launch.missionDescription}
        </p>
      ) : null}
      {launch.watchUrl ? (
        <a
          href={launch.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700"
        >
          <MdPlayCircle className="h-4 w-4" aria-hidden />
          {launch.watchLabel ?? "Watch live"}
        </a>
      ) : null}
    </li>
  );
}

export default function VandenbergLaunchesList({
  launches,
}: {
  launches: VandenbergLaunch[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [nextLaunch, ...futureLaunches] = launches;
  const moreCount = futureLaunches.length;

  if (!nextLaunch) {
    return (
      <p className="text-sm text-muted">
        No upcoming Vandenberg launches in the schedule right now.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        <LaunchCard launch={nextLaunch} featured />
        {expanded
          ? futureLaunches.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} />
            ))
          : null}
      </ul>

      {moreCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
        >
          {expanded
            ? "Show next launch only"
            : `Show ${moreCount} more launch${moreCount === 1 ? "" : "es"}`}
          <MdExpandMore
            className={`h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}
