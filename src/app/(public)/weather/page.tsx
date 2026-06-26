import type { Metadata } from "next";
import SkyPageContent from "@/components/SkyPageContent";
import { fetchSkyPageData } from "@/lib/sky/fetch-sky-page";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Weather & sky",
  description:
    "Current weather, forecast, air quality, Vandenberg launches, and sky watching at Jojoba Hills.",
};

export default async function WeatherPage() {
  const data = await fetchSkyPageData();

  return <SkyPageContent data={data} />;
}
