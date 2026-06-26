"use client";

import { usePathname } from "next/navigation";
import ParkWeatherBar from "@/components/ParkWeatherBar";

export default function ParkWeatherBarGate() {
  const pathname = usePathname();

  // The weather bar lives inside ParkWeatherProvider (public layout only) and
  // duplicates the outdoors page mascot, so skip it on admin and /outdoors.
  if (
    pathname === "/outdoors" ||
    pathname.startsWith("/outdoors/") ||
    pathname === "/weather" ||
    pathname.startsWith("/weather/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return <ParkWeatherBar />;
}
