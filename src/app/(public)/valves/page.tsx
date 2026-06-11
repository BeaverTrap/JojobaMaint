import { Suspense } from "react";
import ValveLookup from "@/components/ValveLookup";

export default function ValvesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Valve & zone lookup
        </h1>
        <p className="text-sm text-muted">
          Find which valves serve a lot or zone — data synced from the Master
          Zone & Valve spreadsheet.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <ValveLookup />
      </Suspense>
    </div>
  );
}
