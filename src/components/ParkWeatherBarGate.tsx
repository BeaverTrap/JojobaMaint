"use client";

import { usePathname } from "next/navigation";
import ParkWeatherBar from "@/components/ParkWeatherBar";

export default function ParkWeatherBarGate() {
  const pathname = usePathname();

  // The weather bar lives inside ParkWeatherProvider (public layout only) and
  // duplicates the /weather page mascot, so skip it on admin and /weather.
  if (
    pathname === "/weather" ||
    pathname.startsWith("/weather/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return <ParkWeatherBar />;
}
