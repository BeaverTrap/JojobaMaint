"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ParkWeatherSnapshot } from "@/lib/park-weather";

const REFRESH_MS = 15 * 60 * 1000;

/** Survives client navigations so the bar and /weather mascot share one snapshot. */
let sessionCache: ParkWeatherSnapshot | null = null;

type ParkWeatherContextValue = {
  data: ParkWeatherSnapshot | null;
  error: boolean;
  loading: boolean;
  refresh: () => void;
};

const ParkWeatherContext = createContext<ParkWeatherContextValue | null>(null);

export function useParkWeather(): ParkWeatherContextValue {
  const ctx = useContext(ParkWeatherContext);
  if (!ctx) {
    throw new Error("useParkWeather must be used within ParkWeatherProvider");
  }
  return ctx;
}

export function ParkWeatherProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ParkWeatherSnapshot | null>(sessionCache);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(sessionCache === null);

  const loadWeather = useCallback(() => {
    fetch("/api/weather")
      .then(async (res) => {
        const json = (await res.json()) as ParkWeatherSnapshot & {
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Weather unavailable");
        sessionCache = json;
        setData(json);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadWeather();
    const interval = window.setInterval(loadWeather, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [loadWeather]);

  const value = useMemo(
    () => ({ data, error, loading, refresh: loadWeather }),
    [data, error, loading, loadWeather],
  );

  return (
    <ParkWeatherContext.Provider value={value}>
      {children}
    </ParkWeatherContext.Provider>
  );
}
