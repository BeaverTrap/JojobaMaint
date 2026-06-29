import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import type { CalendarEvent, WaterSystemStatus } from "@/lib/database.types";
import { waterStatusLabel, waterSupplyModeLabel } from "@/lib/water-status";
import type { ParkAlertStatusOverride } from "@/lib/park-alerts";
import type { StatusTone } from "@/components/StatusIcon";
import StatusCard from "@/components/StatusCard";
import { type StatusArtId } from "@/components/StatusArt";

const STATUS_STYLES: Record<
  WaterSystemStatus["status"],
  { dot: string; badge: string; tone: StatusTone; art: StatusArtId }
> = {
  normal: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    tone: "ok",
    art: "water-ok",
  },
  active_shutoff: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
    tone: "alert",
    art: "water-issue",
  },
  planned_shutoff: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    tone: "warn",
    art: "water-issue",
  },
};

const TONE_BADGE: Record<StatusTone, { dot: string; badge: string }> = {
  ok: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  warn: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  alert: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  },
  info: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  },
};

function formatShutoffWhen(event: CalendarEvent): string {
  const start = new Date(event.start_time);
  if (event.all_day) {
    if (isToday(start)) return "Today";
    if (isTomorrow(start)) return "Tomorrow";
    return format(start, "EEE, MMM d");
  }
  const time = format(start, "h:mm a");
  if (isToday(start)) return `Today · ${time}`;
  if (isTomorrow(start)) return `Tomorrow · ${time}`;
  return format(start, "EEE, MMM d · h:mm a");
}

function formatEnd(endsAt: string | null): string | null {
  if (!endsAt) return null;
  return format(new Date(endsAt), "EEE, MMM d · h:mm a");
}

export default function WaterStatusCard({
  status,
  upcomingShutoffs,
  alertStatus,
}: {
  status: WaterSystemStatus;
  upcomingShutoffs: CalendarEvent[];
  alertStatus?: ParkAlertStatusOverride | null;
}) {
  const baseStyles = STATUS_STYLES[status.status];
  const tone = alertStatus?.tone ?? baseStyles.tone;
  const art = alertStatus?.art ?? baseStyles.art;
  const badgeStyles = alertStatus
    ? TONE_BADGE[alertStatus.tone]
    : { dot: baseStyles.dot, badge: baseStyles.badge };
  const statusText = alertStatus?.statusLabel ?? waterStatusLabel(status.status);

  const restore = status.expected_restore_at
    ? new Date(status.expected_restore_at)
    : null;
  const alertEnds = alertStatus ? formatEnd(alertStatus.endsAt) : null;

  return (
    <StatusCard
      tone={tone}
      art={art}
      title="Water"
      crop={false}
      headerRight={
        <Link
          href="/water"
          className="shrink-0 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          Details →
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${badgeStyles.dot}`} aria-hidden />
          {statusText}
        </span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted">
          {waterSupplyModeLabel(status.supply_mode)}
        </span>
      </div>

      {alertEnds ? (
        <p className="mt-1 text-xs text-muted">Alert ends {alertEnds}</p>
      ) : null}

      {status.affected_areas ? (
        <p className="mt-2 text-sm text-ink">
          <span className="font-medium">Affected:</span> {status.affected_areas}
        </p>
      ) : null}
      {status.note ? (
        <p className="mt-1 text-sm text-muted">{status.note}</p>
      ) : null}
      {restore && status.status !== "normal" && !alertStatus ? (
        <p className="mt-1 text-xs text-muted">
          Expected back {format(restore, "EEE, MMM d · h:mm a")}
        </p>
      ) : null}

      {upcomingShutoffs.length > 0 ? (
        <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Upcoming (from schedule)
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {upcomingShutoffs.slice(0, 2).map((event) => (
              <li key={event.id} className="text-sm">
                <p className="font-medium text-ink">{event.title}</p>
                <p className="text-xs text-muted">{formatShutoffWhen(event)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </StatusCard>
  );
}
