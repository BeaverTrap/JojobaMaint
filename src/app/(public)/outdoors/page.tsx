import type { Metadata } from "next";
import SkyPageContent from "@/components/SkyPageContent";
import { fetchSkyPageData } from "@/lib/sky/fetch-sky-page";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Outdoors",
  description:
    "Weather, sky, earth, and nature around Jojoba Hills — forecast, launches, earthquakes, and more.",
};

export default async function OutdoorsPage() {
  const data = await fetchSkyPageData();

  return <SkyPageContent data={data} />;
}
