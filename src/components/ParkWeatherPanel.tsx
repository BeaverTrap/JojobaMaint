"use client";

import { useEffect, useState } from "react";
import type { ParkWeatherSnapshot } from "@/lib/park-weather";

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

type ParkWeatherPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function ParkWeatherPanel({ open, onClose }: ParkWeatherPanelProps) {
  const [data, setData] = useState<ParkWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/weather")
      .then(async (res) => {
        const json = (await res.json()) as ParkWeatherSnapshot & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Weather unavailable");
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setData(null);
          setError(err.message || "Could not load weather.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close weather panel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="park-weather-title"
        className="relative z-10 flex max-h-[min(90dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 id="park-weather-title" className="text-lg font-bold text-ink">
              Park weather &amp; conditions
            </h2>
            <p className="text-sm text-muted">
              Live data for the resort area (Open-Meteo)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-2xl leading-none text-muted hover:bg-hover hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {loading && (
            <p className="text-sm text-muted">Loading conditions…</p>
          )}
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          )}
          {data && !loading && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-page px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {data.locationLabel}
                </p>
                <p className="mt-2 text-4xl font-bold tabular-nums text-ink">
                  {data.current.temperatureF}°F
                </p>
                <p className="mt-1 text-base text-ink">
                  {data.current.weatherLabel}
                  <span className="text-muted">
                    {" "}
                    · Feels like {data.current.apparentTemperatureF}°F
                  </span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted sm:grid-cols-3">
                  <span>Wind {data.current.windMph} mph {data.current.windDirection}</span>
                  <span>Humidity {data.current.humidityPercent}%</span>
                  <span className="col-span-2 sm:col-span-1">
                    Updated {formatFetchedAt(data.fetchedAt)}
                  </span>
                </div>
              </div>

              {data.airQuality && (
                <div className="rounded-2xl border border-line bg-page px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Air quality
                  </p>
                  <p className="mt-1 text-base font-medium text-ink">
                    US AQI {data.airQuality.usAqi} — {data.airQuality.label}
                  </p>
                  {data.airQuality.pm25 != null && (
                    <p className="mt-0.5 text-sm text-muted">
                      PM2.5 {data.airQuality.pm25.toFixed(1)} µg/m³
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  7-day outlook
                </p>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-page">
                  {data.daily.map((day) => (
                    <li
                      key={day.date}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-ink">
                        {formatDay(day.date)}
                      </span>
                      <span className="text-muted">{day.weatherLabel}</span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {day.highF}° / {day.lowF}°
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {day.precipChancePercent}% rain
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted">
                Conditions refresh about every 15 minutes from Open-Meteo for
                the resort area.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
