"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import {
  MdClose,
  MdExpandMore,
} from "react-icons/md";
import {
  PARK_WEATHER_BAR_LABEL,
  type ParkWeatherSnapshot,
} from "@/lib/park-weather";
import WeatherMascotStack from "@/components/WeatherMascotStack";
import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import DailyOutlookList from "@/components/DailyOutlookList";
import { useParkWeather } from "@/components/ParkWeatherProvider";
import { quailRotationSeed } from "@/lib/weather-mascot-layers";
const MOBILE_MQ = "(max-width: 767px)";

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

function WeatherIcon({ code, isDay }: { code: number; isDay: boolean }) {
  return <WeatherConditionIcon code={code} isDay={isDay} size={16} />;
}

function WeatherForecastPanel({
  data,
  current,
  error,
}: {
  data: ParkWeatherSnapshot | null;
  current: ParkWeatherSnapshot["current"] | undefined;
  error: boolean;
}) {
  if (!data && !error) {
    return <p className="text-sm text-muted">Loading forecast…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
        Could not load weather right now.
      </p>
    );
  }

  if (!data || !current) return null;

  const rotationSeed = quailRotationSeed(data.fetchedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <WeatherMascotStack
            temperatureF={current.temperatureF}
            weatherLabel={current.weatherLabel}
            weatherCode={current.weatherCode}
            isDay={current.isDay}
            rotationSeed={rotationSeed}
            width={180}
            className="relative z-10 sm:hidden"
          />
          <WeatherMascotStack
            temperatureF={current.temperatureF}
            weatherLabel={current.weatherLabel}
            weatherCode={current.weatherCode}
            isDay={current.isDay}
            rotationSeed={rotationSeed}
            width={248}
            className="relative z-10 hidden sm:block"
          />
        </div>

        <div className="min-w-0 w-full flex-1">
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

            {data.airQuality ? (
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
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900/70 dark:text-sky-300/70">
          7-day outlook
        </p>
        <DailyOutlookList days={data.daily} compact />
      </div>

      <p className="hidden pt-1 text-[11px] text-muted md:block">
        Tap <strong className="font-semibold text-ink">Forecast</strong> for a
        quick look, or open the{" "}
        <Link href="/weather" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          full weather &amp; sky page
        </Link>
        . Refreshes about every 15 minutes.
      </p>
    </div>
  );
}

export default function ParkWeatherBar() {
  const forecastId = useId();
  const { data, error } = useParkWeather();
  const [expanded, setExpanded] = useState(false);

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

  useEffect(() => {
    if (!expanded) return;
    if (!window.matchMedia(MOBILE_MQ).matches) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const closeForecast = useCallback(() => {
    setExpanded(false);
  }, []);

  const toggleForecast = useCallback(() => {
    setExpanded((open) => !open);
  }, []);

  if (error && !data) return null;

  const current = data?.current;
  const barSurface =
    "border-b border-sky-200/80 bg-gradient-to-r from-sky-50 to-sky-100/80 dark:border-sky-900/50 dark:from-sky-950/40 dark:to-sky-900/20";

  return (
    <div className="no-print" data-weather-expanded={expanded ? "true" : "false"}>
      <div className={`sticky top-14 z-20 motion-fade-in ${barSurface}`}>
        <div className="mx-auto max-w-5xl px-3 sm:px-4">
          <div
            role="status"
            aria-label={`${PARK_WEATHER_BAR_LABEL} conditions`}
            className="flex items-center gap-2 py-1.5 sm:gap-3"
          >
            <Link
              href="/weather"
              className="flex min-w-0 flex-1 items-center gap-2 text-sm text-sky-950 hover:opacity-90 dark:text-sky-100"
            >
              {current ? (
                <>
                  <span className="min-w-0 shrink truncate text-xs font-semibold text-sky-900/90 sm:text-sm dark:text-sky-100/90">
                    {PARK_WEATHER_BAR_LABEL}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-200/60 text-sky-800 dark:bg-sky-800/40 dark:text-sky-200">
                    <WeatherIcon code={current.weatherCode} isDay={current.isDay} />
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
                  Loading weather at Jojoba Hills…
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={toggleForecast}
              aria-expanded={expanded}
              aria-controls={`${forecastId}-mobile ${forecastId}-desktop`}
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
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[45] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Jojoba Hills weather forecast"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 motion-overlay-enter"
            onClick={closeForecast}
            aria-label="Close forecast"
          />
          <div
            className={`absolute inset-x-0 top-14 flex max-h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom)-4.5rem)] flex-col motion-panel-enter ${barSurface} shadow-lg`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-sky-200/70 px-3 py-2 dark:border-sky-800/40">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                Forecast
              </p>
              <button
                type="button"
                onClick={closeForecast}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-200/50 dark:text-sky-100 dark:hover:bg-sky-800/40"
              >
                <MdClose className="h-4 w-4" aria-hidden />
                Close
              </button>
            </div>
            <div
              id={`${forecastId}-mobile`}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            >
              <WeatherForecastPanel
                data={data}
                current={current}
                error={error}
              />
              <p className="mt-3 border-t border-sky-200/70 pt-3 text-center text-xs dark:border-sky-800/40">
                <Link
                  href="/weather"
                  className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  onClick={closeForecast}
                >
                  Open full weather &amp; sky page →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`hidden md:block ${barSurface}`}>
        <div className="mx-auto max-w-5xl px-3 sm:px-4">
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div
                id={`${forecastId}-desktop`}
                role="region"
                aria-label="Park weather forecast"
                className={`border-t border-sky-200/70 pb-3 pt-2 transition-opacity duration-300 ease-out motion-reduce:transition-none dark:border-sky-800/40 ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
              >
                <WeatherForecastPanel
                  data={data}
                  current={current}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
