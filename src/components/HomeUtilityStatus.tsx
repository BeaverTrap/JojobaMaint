import type {
  CalendarEvent,
  PowerStatus,
  WaterSystemStatus,
} from "@/lib/database.types";
import type { ParkAlertStatusOverride } from "@/lib/park-alerts";
import WaterStatusCard from "@/components/WaterStatusCard";
import PowerStatusCard from "@/components/PowerStatusCard";

export default function HomeUtilityStatus({
  waterStatus,
  upcomingShutoffs,
  powerStatus,
  waterAlert,
  powerAlert,
}: {
  waterStatus: WaterSystemStatus;
  upcomingShutoffs: CalendarEvent[];
  powerStatus: PowerStatus;
  waterAlert?: ParkAlertStatusOverride | null;
  powerAlert?: ParkAlertStatusOverride | null;
}) {
  return (
    <section aria-labelledby="home-utilities-heading" className="space-y-3">
      <h2
        id="home-utilities-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted"
      >
        Water &amp; power
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <WaterStatusCard
          status={waterStatus}
          upcomingShutoffs={upcomingShutoffs}
          alertStatus={waterAlert}
        />
        <PowerStatusCard manualStatus={powerStatus} alertStatus={powerAlert} />
      </div>
    </section>
  );
}
