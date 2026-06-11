"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParkMap } from "@/components/ParkMap";
import { lotHref } from "@/lib/lot-slug";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70dvh] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Park map</h1>
          <p className="text-sm text-muted">
            Tap a lot for its profile, or use{" "}
            <Link href="/valves" className="font-medium text-brand-700 hover:underline">
              valve lookup
            </Link>{" "}
            to find shutoff valves.
          </p>
        </div>
        <Link
          href="/lots"
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
        >
          All lots
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <ParkMap
          fillHeight
          zoomable
          onLotClick={(lotId) => router.push(lotHref(lotId))}
        />
      </div>
    </div>
  );
}
