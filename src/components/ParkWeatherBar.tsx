"use client";

import { useCallback, useEffect, useState } from "react";
import { MdWbCloudy, MdWbSunny, MdWaterDrop } from "react-icons/md";
import ParkWeatherPanel from "@/components/ParkWeatherPanel";
import type { ParkWeatherSnapshot } from "@/lib/park-weather";

const REFRESH_MS = 15 * 60 * 1000;

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
  const [data, setData] = useState<ParkWeatherSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

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

  if (error && !data) return null;

  const current = data?.current;

  return (
    <>
      <div
        role="status"
        aria-label="Park weather conditions"
        className="no-print border-b border-sky-200/80 bg-gradient-to-r from-sky-50 to-sky-100/80 dark:border-sky-900/50 dark:from-sky-950/40 dark:to-sky-900/20"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
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
            onClick={() => setPanelOpen(true)}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-200/50 dark:text-sky-100 dark:hover:bg-sky-800/40"
          >
            Forecast
          </button>
        </div>
      </div>

      <ParkWeatherPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
