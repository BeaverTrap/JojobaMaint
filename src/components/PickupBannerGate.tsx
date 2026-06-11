"use client";

import { usePathname } from "next/navigation";
import PickupBanner from "@/components/PickupBanner";

/** Index pages that show the pickup notice below the navbar. */
const PICKUP_BANNER_PATHS = new Set([
  "/",
  "/schedule",
  "/request",
  "/pickup-guidelines",
]);

export default function PickupBannerGate({
  isSummerSchedule,
}: {
  isSummerSchedule: boolean;
}) {
  const pathname = usePathname();
  if (!PICKUP_BANNER_PATHS.has(pathname)) return null;
  return (
    <PickupBanner
      isSummerSchedule={isSummerSchedule}
      showGuidelinesLink={pathname !== "/pickup-guidelines"}
    />
  );
}
