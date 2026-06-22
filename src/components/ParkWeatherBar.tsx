"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  MdExpandMore,
  MdWbCloudy,
  MdWbSunny,
  MdWaterDrop,
} from "react-icons/md";
import type { ParkWeatherSnapshot } from "@/lib/park-weather";

const REFRESH_MS = 15 * 60 * 1000;

function formatDay(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function WeatherIcon({ code }: { code: number }) {
  if (code === 0 || code === 1) {
    return <MdWbSunny className="h-4 w-4 shrink-0" aria-hidden />;
  }
  if (code >= 51 && code <= 67) {
    return <MdWaterDrop className="h-4 w-4 shrink-0" aria-hidden />;
  }
  return <MdWbCloudy className="h-4 w-4 shrink-0" aria-hidden />;
}

export default function ParkWeatherBar() {
  const forecastId = useId();
  const [data, setData] = useState<ParkWeatherSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadWeather = useCallback(() => {
    fetch("/api/weather")
      .then(async (res) => {
        const json = (await res.json()) as ParkWeatherSnapshot & {
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Weather unavailable");
        setData(json);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  useEffect(() => {
    loadWeather();
    const interval = window.setInterval(loadWeather, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [loadWeather]);

  useEffect(() => {
    if (!expanded) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const toggleForecast = useCallback(() => {
    setExpanded((open) => !open);
  }, []);

  if (error && !data) return null;

  const current = data?.current;

  return (
    <div
      className="no-print border-b border-sky-200/80 bg-gradient-to-r from-sky-50 to-sky-100/80 dark:border-sky-900/50 dark:from-sky-950/40 dark:to-sky-900/20"
      data-weather-expanded={expanded ? "true" : "false"}
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <div
          role="status"
          aria-label="Park weather conditions"
          className="flex items-center gap-2 py-1.5 sm:gap-3"
        >
          <button
            type="button"
            onClick={toggleForecast}
            aria-expanded={expanded}
            aria-controls={forecastId}
            className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-sky-950 hover:opacity-90 dark:text-sky-100"
          >
            {current ? (
              <>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-200/60 text-sky-800 dark:bg-sky-800/40 dark:text-sky-200">
                  <WeatherIcon code={current.weatherCode} />
                </span>
                <span className="min-w-0 truncate font-semibold tabular-nums">
                  {current.temperatureF}°F
                </span>
                <span className="hidden truncate text-sky-900/90 sm:inline dark:text-sky-200/90">
                  {current.weatherLabel}
                </span>
                <span className="hidden truncate text-xs text-sky-800/80 md:inline dark:text-sky-300/80">
                  Wind {current.windMph} mph {current.windDirection}
                  <span className="mx-1.5 opacity-40">·</span>
                  Humidity {current.humidityPercent}%
                </span>
                {data.airQuality && (
                  <span className="hidden truncate text-xs text-sky-800/80 lg:inline dark:text-sky-300/80">
                    <span className="mx-1.5 opacity-40">·</span>
                    AQI {data.airQuality.usAqi}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-sky-800/80 dark:text-sky-300/80">
                Loading park weather…
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleForecast}
            aria-expanded={expanded}
            aria-controls={forecastId}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-200/50 dark:text-sky-100 dark:hover:bg-sky-800/40"
          >
            Forecast
            <MdExpandMore
              className={`h-4 w-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                expanded ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div
              id={forecastId}
              role="region"
              aria-label="Park weather forecast"
              className={`border-t border-sky-200/70 pb-3 pt-2 transition-opacity duration-300 ease-out motion-reduce:transition-none dark:border-sky-800/40 ${
                expanded ? "opacity-100" : "opacity-0"
              }`}
            >
              {!data && !error && (
                <p className="text-sm text-muted">Loading forecast…</p>
              )}
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
                  Could not load weather right now.
                </p>
              )}
              {data && current && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="rounded-xl border border-line/80 bg-surface/90 px-3 py-2.5 shadow-sm dark:bg-surface/80">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {data.locationLabel}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                        {current.temperatureF}°F
                      </p>
                      <p className="mt-0.5 text-sm text-ink">
                        {current.weatherLabel}
                        <span className="text-muted">
                          {" "}
                          · Feels like {current.apparentTemperatureF}°F
                        </span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        <span>
                          Wind {current.windMph} mph {current.windDirection}
                        </span>
                        <span>Humidity {current.humidityPercent}%</span>
                        <span>Updated {formatFetchedAt(data.fetchedAt)}</span>
                      </div>
                    </div>

                    {data.airQuality && (
                      <div className="rounded-xl border border-line/80 bg-surface/90 px-3 py-2.5 shadow-sm dark:bg-surface/80 sm:min-w-[10rem]">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Air quality
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          AQI {data.airQuality.usAqi}
                        </p>
                        <p className="text-xs text-muted">
                          {data.airQuality.label}
                          {data.airQuality.pm25 != null && (
                            <>
                              {" "}
                              · PM2.5 {data.airQuality.pm25.toFixed(1)} µg/m³
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900/70 dark:text-sky-300/70">
                      7-day outlook
                    </p>
                    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line/80 bg-surface/90 shadow-sm dark:bg-surface/80">
                      {data.daily.map((day) => (
                        <li
                          key={day.date}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-sm sm:grid-cols-[7rem_1fr_auto_auto]"
                        >
                          <span className="font-medium text-ink">
                            {formatDay(day.date)}
                          </span>
                          <span className="truncate text-muted sm:col-start-2">
                            {day.weatherLabel}
                          </span>
                          <span className="shrink-0 tabular-nums font-medium text-ink">
                            {day.highF}° / {day.lowF}°
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {day.precipChancePercent}% rain
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[11px] text-muted">
                    Tap <strong className="font-semibold text-ink">Forecast</strong>{" "}
                    or the conditions line anytime to open or close this panel.
                    Refreshes about every 15 minutes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
