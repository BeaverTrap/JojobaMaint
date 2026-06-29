"use client";

import Link from "next/link";
import { PARK_WEATHER_BAR_LABEL } from "@/lib/park-weather";
import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import { useParkWeather } from "@/components/ParkWeatherProvider";

function WeatherIcon({ code, isDay }: { code: number; isDay: boolean }) {
  return <WeatherConditionIcon code={code} isDay={isDay} size={16} />;
}

export default function ParkWeatherBar() {
  const { data, error } = useParkWeather();

  if (error && !data) return null;

  const current = data?.current;
  const barSurface =
    "border-b border-sky-200/80 bg-gradient-to-r from-sky-50 to-sky-100/80 dark:border-sky-900/50 dark:from-sky-950/40 dark:to-sky-900/20";

  return (
    <div className={`no-print sticky top-14 z-20 motion-fade-in ${barSurface}`}>
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        <Link
          href="/weather"
          role="status"
          aria-label={`${PARK_WEATHER_BAR_LABEL} conditions`}
          className="flex items-center gap-2 py-1.5 text-sm text-sky-950 hover:opacity-90 sm:gap-3 dark:text-sky-100"
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
                <span className="ml-auto hidden shrink-0 truncate text-xs font-semibold text-brand-700 sm:inline dark:text-brand-300">
                  Weather &amp; sky →
                </span>
              </>
            ) : (
              <span className="text-xs text-sky-800/80 dark:text-sky-300/80">
                Loading weather at Jojoba Hills…
              </span>
            )}
          </Link>
      </div>
    </div>
  );
}
