"use client";

import { useState } from "react";
import DailyOutlookList from "@/components/DailyOutlookList";
import HourlyForecastStrip from "@/components/HourlyForecastStrip";
import type { ParkWeatherDaily } from "@/lib/park-weather";
import type { ParkWeatherHourly } from "@/lib/sky/types";

type ForecastView = "hourly" | "daily";

export default function WeatherForecastSection({
  hourly,
  daily,
  fetchedAt,
}: {
  hourly: ParkWeatherHourly[];
  daily: ParkWeatherDaily[];
  fetchedAt: string;
}) {
  const [view, setView] = useState<ForecastView>(
    hourly.length > 0 ? "hourly" : "daily",
  );

  return (
    <section className="motion-card overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-sky-50/90 to-surface px-4 py-3 dark:from-sky-950/25 dark:to-surface sm:px-5">
        <h2 className="text-base font-semibold text-ink">Forecast</h2>
        <div
          className="flex rounded-lg bg-surface/90 p-0.5 ring-1 ring-line"
          role="tablist"
          aria-label="Forecast range"
        >
          {hourly.length > 0 ? (
            <button
              type="button"
              role="tab"
              aria-selected={view === "hourly"}
              onClick={() => setView("hourly")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "hourly"
                  ? "bg-ink text-surface shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              48 hours
            </button>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={view === "daily"}
            onClick={() => setView("daily")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === "daily"
                ? "bg-ink text-surface shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            7-day
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {view === "hourly" && hourly.length > 0 ? (
          <HourlyForecastStrip hours={hourly} fetchedAt={fetchedAt} />
        ) : (
          <DailyOutlookList days={daily} showTempBar />
        )}
      </div>
    </section>
  );
}
