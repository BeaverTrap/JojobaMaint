import type { Metadata } from "next";
import WeatherStackSandbox from "@/components/WeatherStackSandbox";
import { requireStaffRole } from "@/lib/require-staff-role";

export const metadata: Metadata = {
  title: "Weather mascot setup",
  robots: { index: false, follow: false },
};

export default async function WeatherStackPage() {
  await requireStaffRole("admin");

  return <WeatherStackSandbox />;
}
