"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MdExpandMore } from "react-icons/md";
import type { ParkFacilityBuilding } from "@/lib/database.types";
import type { WaterFacilityClosure } from "@/lib/water-status";
import FacilityLocationCard from "@/components/FacilityLocationCard";
import { StatusArtBleed } from "@/components/StatusArt";
import {
  TONE_CARD_GRADIENT,
  TONE_CARD_OVERLAY,
} from "@/components/StatusIcon";
import {
  facilitiesOverallSummary,
  facilitiesOverallTone,
} from "@/lib/facility-status";

function formatClosureEnd(endsAt: string | null): string | null {
  if (!endsAt) return null;
  return format(new Date(endsAt), "EEE, MMM d · h:mm a");
}

export default function HomeFacilitiesStatus({
  locations,
  waterClosure,
}: {
  locations: ParkFacilityBuilding[];
  waterClosure?: WaterFacilityClosure;
}) {
  const closedByWater = waterClosure?.closed ?? false;
  const tone = closedByWater ? "alert" : facilitiesOverallTone(locations);
  const art = tone === "ok" ? "laundry-ok" : "laundry-issue";
  const summary = closedByWater
    ? `Closed — ${waterClosure!.label.toLowerCase()}`
    : facilitiesOverallSummary(locations);
  const ends = closedByWater ? formatClosureEnd(waterClosure!.endsAt) : null;

  const [expanded, setExpanded] = useState(tone !== "ok" || closedByWater);

  return (
    <section
      aria-labelledby="home-facilities-heading"
      className="relative mt-7 rounded-3xl border border-line bg-surface shadow-sm"
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="home-facilities-panel"
        className={`relative flex min-h-[100px] w-full flex-col justify-center overflow-visible rounded-t-3xl border-b border-line px-4 py-3 text-left hover:brightness-[0.98] dark:hover:brightness-110 ${TONE_CARD_GRADIENT[tone]} ${expanded ? "" : "rounded-b-3xl border-b-0"}`}
      >
        <StatusArtBleed
          art={art}
          tone={tone}
          size={148}
          objectClassName="object-contain object-bottom"
          className="bottom-0 left-2 z-0 origin-bottom drop-shadow-sm"
        />
        <span
          aria-hidden
          className={`absolute inset-0 z-[1] bg-gradient-to-l ${TONE_CARD_OVERLAY[tone]} from-35% to-transparent to-85%`}
        />
        <div className="relative z-10 flex items-center gap-2 pl-32">
          <div className="min-w-0 flex-1 text-right">
            <h2
              id="home-facilities-heading"
              className="text-base font-bold leading-tight text-ink"
            >
              Laundry &amp; restrooms
            </h2>
            <p className="mt-0.5 text-xs text-muted">{summary}</p>
            {ends ? (
              <p className="mt-1 text-xs text-muted">Expected back {ends}</p>
            ) : null}
          </div>
          <MdExpandMore
            className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
      </button>

      {expanded ? (
        <div
          id="home-facilities-panel"
          className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {locations.map((location) => (
            <FacilityLocationCard
              key={location.id}
              location={location}
              closedByWater={closedByWater}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
