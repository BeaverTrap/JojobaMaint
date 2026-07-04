import type { Metadata } from "next";
import WeatherStackSandbox from "@/components/WeatherStackSandbox";
import { requireWebmasterRole } from "@/lib/require-webmaster-role";

export const metadata: Metadata = {
  title: "Weather mascot setup",
  robots: { index: false, follow: false },
};

export default async function WeatherStackPage() {
  await requireWebmasterRole();

  return <WeatherStackSandbox />;
}
