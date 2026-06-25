import type { Metadata } from "next";
import WeatherStackSandbox from "@/components/WeatherStackSandbox";

export const metadata: Metadata = {
  title: "Weather mascot setup",
  robots: { index: false, follow: false },
};

export default function WeatherStackPage() {
  return <WeatherStackSandbox />;
}
