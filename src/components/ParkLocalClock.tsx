"use client";

import { useEffect, useState } from "react";
import { PARK_TIMEZONE } from "@/lib/park-weather";

function formatParkClock(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: PARK_TIMEZONE,
  });
}

export default function ParkLocalClock({
  labelClassName = "text-muted",
  valueClassName = "text-ink",
}: {
  labelClassName?: string;
  valueClassName?: string;
}) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatParkClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="shrink-0 text-right">
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${labelClassName}`}
      >
        Park time
      </p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums leading-none sm:text-xl ${valueClassName}`}
        suppressHydrationWarning
      >
        {time ?? "—"}
      </p>
    </div>
  );
}
