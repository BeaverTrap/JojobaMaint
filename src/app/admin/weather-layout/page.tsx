import Link from "next/link";
import type { Metadata } from "next";
import { requireWebmasterRole } from "@/lib/require-webmaster-role";
import WeatherStackSandbox from "@/components/WeatherStackSandbox";

export const metadata: Metadata = {
  title: "Weather mascot layout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WeatherLayoutPage() {
  await requireWebmasterRole();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
          ← Dashboard
        </Link>
      </div>
      <WeatherStackSandbox />
    </div>
  );
}
