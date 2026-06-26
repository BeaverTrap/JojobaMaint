"use client";

import { useState } from "react";
import { MdExpandMore } from "react-icons/md";
import { formatIssDuration, formatIssPassTime } from "@/lib/sky/iss-passes";
import type { IssPass } from "@/lib/sky/types";

function PassCard({ pass }: { pass: IssPass }) {
  return (
    <li className="rounded-lg border border-line bg-surface/90 px-3 py-2">
      <p className="text-sm font-medium text-ink">
        {formatIssPassTime(pass.riseTime)}
      </p>
      <p className="text-xs text-muted">
        Visible for {formatIssDuration(pass.durationSeconds)} ·{" "}
        {pass.maxElevationNote}
      </p>
    </li>
  );
}

export default function IssPassesList({ passes }: { passes: IssPass[] }) {
  const [expanded, setExpanded] = useState(false);
  const [nextPass, ...futurePasses] = passes;
  const moreCount = futurePasses.length;

  if (!nextPass) {
    return (
      <p className="mt-2 text-sm text-muted">
        No upcoming visible passes listed — check back later.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <ul className="space-y-2">
        <PassCard pass={nextPass} />
        {expanded
          ? futurePasses.map((pass) => (
              <PassCard key={pass.riseTime} pass={pass} />
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
            ? "Show next pass only"
            : `Show ${moreCount} more pass${moreCount === 1 ? "" : "es"}`}
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
