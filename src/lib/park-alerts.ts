import type { StatusArtId } from "@/components/StatusArt";
import type { StatusTone } from "@/components/StatusIcon";
import type {
  AnnouncementSeverity,
  AnnouncementWithAuthor,
  ParkAlertType,
} from "@/lib/database.types";

export const PARK_ALERT_TYPE_OPTIONS: {
  value: ParkAlertType;
  label: string;
  hint: string;
}[] = [
  {
    value: "general",
    label: "Park-wide notice",
    hint: "Shows on park alerts only.",
  },
  {
    value: "water_shutoff",
    label: "Water — active shutoff",
    hint: "Park alerts + water card; laundry & restrooms close.",
  },
  {
    value: "water_planned",
    label: "Water — planned shutoff",
    hint: "Park alerts + water card; laundry & restrooms close.",
  },
  {
    value: "water_gravity",
    label: "Water — gravity feed",
    hint: "Park alerts + water card status.",
  },
  {
    value: "power_outage",
    label: "Power — active outage",
    hint: "Park alerts + power card status.",
  },
  {
    value: "power_planned",
    label: "Power — planned work",
    hint: "Park alerts + power card status.",
  },
];

const SEVERITY_RANK = { urgent: 0, notice: 1, info: 2 } as const;

export function parkAlertTypeLabel(type: ParkAlertType): string {
  return (
    PARK_ALERT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    type
  );
}

export function parkAlertShortLabel(type: ParkAlertType): string {
  switch (type) {
    case "water_shutoff":
      return "Water shutoff";
    case "water_planned":
      return "Planned water shutoff";
    case "water_gravity":
      return "Gravity feed";
    case "power_outage":
      return "Power outage";
    case "power_planned":
      return "Planned power work";
    case "laundry":
      return "Laundry";
    case "general":
      return "Park notice";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function parkAlertTypeArt(
  type: ParkAlertType,
  severity: AnnouncementSeverity = "info",
): { tone: StatusTone; art: StatusArtId } {
  switch (type) {
    case "water_shutoff":
      return { tone: "alert", art: "water-issue" };
    case "water_planned":
      return { tone: "warn", art: "planned" };
    case "water_gravity":
      return { tone: "warn", art: "water-issue" };
    case "power_outage":
      return { tone: "alert", art: "power-issue" };
    case "power_planned":
      return { tone: "warn", art: "planned" };
    case "laundry":
      return { tone: "warn", art: "laundry-issue" };
    case "general":
      switch (severity) {
        case "urgent":
          return { tone: "alert", art: "alert" };
        case "notice":
          return { tone: "warn", art: "alert" };
        case "info":
          return { tone: "info", art: "info" };
        default: {
          const _exhaustive: never = severity;
          return _exhaustive;
        }
      }
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function suggestedSeverityForAlertType(
  type: ParkAlertType,
): AnnouncementWithAuthor["severity"] {
  switch (type) {
    case "water_shutoff":
    case "power_outage":
      return "urgent";
    case "water_planned":
    case "water_gravity":
    case "power_planned":
    case "laundry":
      return "notice";
    case "general":
      return "info";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function isAlertActive(
  row: Pick<AnnouncementWithAuthor, "published" | "starts_at" | "ends_at">,
  now = Date.now(),
): boolean {
  if (!row.published) return false;
  if (new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false;
  return true;
}

export function sortParkAlerts(
  alerts: AnnouncementWithAuthor[],
): AnnouncementWithAuthor[] {
  return [...alerts].sort((a, b) => {
    const severityDiff =
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) return severityDiff;
    if (a.position !== b.position) return a.position - b.position;
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });
}

function pickDomainAlert(
  alerts: AnnouncementWithAuthor[],
  types: ParkAlertType[],
): AnnouncementWithAuthor | null {
  const matches = alerts.filter((alert) => types.includes(alert.alert_type));
  if (matches.length === 0) return null;
  return sortParkAlerts(matches)[0];
}

/** Visual status pushed to utility cards — message stays on park alerts board. */
export type ParkAlertStatusOverride = {
  alertType: ParkAlertType;
  tone: StatusTone;
  art: StatusArtId;
  statusLabel: string;
  endsAt: string | null;
};

export type ResolvedParkAlerts = {
  /** All active alerts in one park alerts section. */
  boardAlerts: AnnouncementWithAuthor[];
  water: ParkAlertStatusOverride | null;
  power: ParkAlertStatusOverride | null;
};

function toStatusOverride(alert: AnnouncementWithAuthor): ParkAlertStatusOverride {
  const type = alert.alert_type ?? "general";
  const { tone, art } = parkAlertTypeArt(type, alert.severity);
  return {
    alertType: type,
    tone,
    art,
    statusLabel: parkAlertShortLabel(type),
    endsAt: alert.ends_at,
  };
}

/** Resolve park alerts board + status overrides for affected utility cards. */
export function resolveParkAlerts(
  announcements: AnnouncementWithAuthor[],
): ResolvedParkAlerts {
  const boardAlerts = sortParkAlerts(
    announcements
      .map((alert) => ({
        ...alert,
        alert_type: alert.alert_type ?? "general",
      }))
      .filter((alert) => isAlertActive(alert)),
  );

  const waterAlert = pickDomainAlert(boardAlerts, [
    "water_shutoff",
    "water_planned",
    "water_gravity",
  ]);
  const powerAlert = pickDomainAlert(boardAlerts, [
    "power_outage",
    "power_planned",
  ]);

  return {
    boardAlerts,
    water: waterAlert ? toStatusOverride(waterAlert) : null,
    power: powerAlert ? toStatusOverride(powerAlert) : null,
  };
}

export function alertAffectsWater(type: ParkAlertType): boolean {
  return (
    type === "water_shutoff" ||
    type === "water_planned" ||
    type === "water_gravity"
  );
}

export function alertAffectsPower(type: ParkAlertType): boolean {
  return type === "power_outage" || type === "power_planned";
}

export function alertAffectsLaundry(type: ParkAlertType): boolean {
  return type === "laundry";
}

/** Park alert types that mean laundry/restrooms must close (no water). */
export function waterAlertClosesFacilities(type: ParkAlertType): boolean {
  return type === "water_shutoff" || type === "water_planned";
}
