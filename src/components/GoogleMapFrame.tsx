"use client";

import type { ReactNode } from "react";
import { APIProvider, ColorScheme } from "@vis.gl/react-google-maps";
import { useSiteDarkMode } from "@/lib/use-site-dark-mode";
import { googleMapsApiKey } from "@/lib/map-geography";

type GoogleMapFrameProps = {
  children: ReactNode;
  fillHeight?: boolean;
  className?: string;
};

/** Gives Google Map children a definite height (fixes blank map when parent uses h-full). */
export function GoogleMapFrame({
  children,
  fillHeight = false,
  className = "",
}: GoogleMapFrameProps) {
  const apiKey = googleMapsApiKey();
  const isDark = useSiteDarkMode();

  if (!apiKey) return null;

  const outerClass = fillHeight
    ? "relative min-h-[320px] w-full flex-1"
    : "relative h-[min(70dvh,42rem)] min-h-[360px] w-full";

  return (
    <div className={`${outerClass} ${className}`}>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <APIProvider apiKey={apiKey} libraries={["marker"]}>
          <div
            className="h-full w-full"
            data-map-color-scheme={isDark ? "dark" : "light"}
            suppressHydrationWarning
          >
            {children}
          </div>
        </APIProvider>
      </div>
    </div>
  );
}

export function useGoogleMapColorScheme() {
  const isDark = useSiteDarkMode();
  return isDark ? ColorScheme.DARK : ColorScheme.LIGHT;
}
