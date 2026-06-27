"use client";

import { useEffect, useState } from "react";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function splitRemaining(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Live D : HH : MM : SS countdown to an ISO target time. Renders a "now"
 * message once the target passes. Mounts client-side to avoid hydration drift.
 */
export default function Countdown({
  target,
  nowLabel = "Happening now",
  tone = "dark",
}: {
  target: string;
  nowLabel?: string;
  tone?: "dark" | "light";
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    if (Number.isNaN(targetMs)) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(targetMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const segBg =
    tone === "dark"
      ? "bg-white/10 text-white ring-1 ring-white/15"
      : "bg-brand-50 text-ink ring-1 ring-brand-200 dark:bg-brand-950/40 dark:text-ink";
  const labelColor = tone === "dark" ? "text-white/50" : "text-muted";
  const sepColor = tone === "dark" ? "text-white/30" : "text-muted/50";

  if (remaining !== null && remaining <= 0) {
    return (
      <p
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold ${
          tone === "dark"
            ? "bg-emerald-400/20 text-emerald-100"
            : "bg-emerald-100 text-emerald-900"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        {nowLabel}
      </p>
    );
  }

  const parts = remaining === null ? null : splitRemaining(remaining);

  const segments: { value: string; label: string }[] = [
    { value: parts ? String(parts.days) : "—", label: "days" },
    { value: parts ? pad(parts.hours) : "—", label: "hrs" },
    { value: parts ? pad(parts.minutes) : "—", label: "min" },
    { value: parts ? pad(parts.seconds) : "—", label: "sec" },
  ];

  return (
    <div className="flex items-end gap-1.5" aria-label="Time until next event">
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-end gap-1.5">
          <div className="flex flex-col items-center">
            <span
              className={`min-w-[2.4ch] rounded-md px-1.5 py-1 text-center text-2xl font-bold tabular-nums ${segBg}`}
            >
              {seg.value}
            </span>
            <span
              className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}
            >
              {seg.label}
            </span>
          </div>
          {i < segments.length - 1 ? (
            <span className={`pb-5 text-xl font-bold ${sepColor}`}>:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
