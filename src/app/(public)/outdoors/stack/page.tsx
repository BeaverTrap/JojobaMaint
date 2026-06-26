import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WeatherStackSandbox from "@/components/WeatherStackSandbox";
import { requireStaffRole } from "@/lib/require-staff-role";

export const metadata: Metadata = {
  title: "Outdoors mascot setup",
  robots: { index: false, follow: false },
};

export default async function OutdoorsStackPage() {
  await requireStaffRole("admin");

  return <WeatherStackSandbox />;
}
