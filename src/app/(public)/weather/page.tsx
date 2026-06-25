import type { Metadata } from "next";
import SkyPageContent from "@/components/SkyPageContent";
import { fetchSkyPageData } from "@/lib/sky/fetch-sky-page";
import { PARK_WEATHER_BAR_LABEL } from "@/lib/park-weather";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Weather & sky",
  description:
    "Current weather, forecast, air quality, Vandenberg launches, and sky watching at Jojoba Hills.",
};

export default async function WeatherPage() {
  const data = await fetchSkyPageData();

  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        {PARK_WEATHER_BAR_LABEL} — full forecast and sky watch for the park
      </p>
      <SkyPageContent data={data} />
    </div>
  );
}
