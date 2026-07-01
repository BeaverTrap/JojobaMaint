"use client";

import { useEffect, useState } from "react";
import { MdSchedule } from "react-icons/md";
import { PARK_TIMEZONE } from "@/lib/park-time";

type ClockParts = { time: string; period: string };

function formatParkClock(date: Date): ClockParts {
  const full = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: PARK_TIMEZONE,
  });
  const match = full.match(/^(.*)\s(AM|PM)$/i);
  if (match) return { time: match[1], period: match[2].toUpperCase() };
  return { time: full, period: "" };
}

export default function ParkLocalClock({
  labelClassName = "text-muted",
  valueClassName = "text-ink",
}: {
  labelClassName?: string;
  valueClassName?: string;
}) {
  const [parts, setParts] = useState<ClockParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(formatParkClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 shadow-sm ring-1 ring-white/30 backdrop-blur-sm dark:bg-white/10 dark:ring-white/15">
        <MdSchedule
          className={`h-4 w-4 shrink-0 opacity-70 ${valueClassName}`}
          aria-hidden
        />
        <div className="text-right">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.14em] leading-none ${labelClassName}`}
          >
            Park time
          </p>
          <p
            className={`mt-1 flex items-baseline justify-end gap-1 leading-none ${valueClassName}`}
            suppressHydrationWarning
          >
            <span className="text-lg font-bold tabular-nums sm:text-xl">
              {parts?.time ?? "—"}
            </span>
            {parts?.period ? (
              <span className="text-[11px] font-semibold opacity-70">
                {parts.period}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
