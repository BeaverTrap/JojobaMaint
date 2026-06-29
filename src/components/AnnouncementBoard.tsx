import type { AnnouncementWithAuthor } from "@/lib/database.types";
import {
  parkAlertShortLabel,
  parkAlertTypeArt,
  sortParkAlerts,
  isAlertActive,
} from "@/lib/park-alerts";
import StatusCard from "@/components/StatusCard";

function formatAlertEnd(endsAt: string | null): string | null {
  if (!endsAt) return null;
  return new Date(endsAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AnnouncementBoard({
  announcements,
}: {
  announcements: AnnouncementWithAuthor[];
}) {
  const active = sortParkAlerts(
    announcements.filter((alert) => isAlertActive(alert)),
  );

  if (active.length === 0) {
    return (
      <section aria-labelledby="home-announcements-heading" className="space-y-3">
        <h2
          id="home-announcements-heading"
          className="text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Park alerts
        </h2>
        <StatusCard art="all-clear" tone="ok" title="All clear" crop={false} />
      </section>
    );
  }

  const [primary, ...rest] = active;

  return (
    <section aria-labelledby="home-announcements-heading" className="space-y-3">
      <h2
        id="home-announcements-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted"
      >
        Park alerts
      </h2>
      <ul className="space-y-3">
        <AlertCard alert={primary} />
        {rest.map((alert) => (
          <li key={alert.id}>
            <AlertCard alert={alert} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlertCard({
  alert,
  compact = false,
}: {
  alert: AnnouncementWithAuthor;
  compact?: boolean;
}) {
  const type = alert.alert_type ?? "general";
  const { tone, art } = parkAlertTypeArt(type, alert.severity);
  const ends = formatAlertEnd(alert.ends_at);

  const card = (
    <StatusCard
      tone={tone}
      art={art}
      crop={false}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink dark:bg-white/10">
            {parkAlertShortLabel(type)}
          </span>
          {alert.title}
        </span>
      }
    >
      <p
        className={`whitespace-pre-wrap leading-relaxed text-ink/90 ${
          compact ? "line-clamp-2 text-sm" : "text-sm"
        }`}
      >
        {alert.body}
      </p>
      {ends ? <p className="mt-2 text-xs text-muted">Ends {ends}</p> : null}
    </StatusCard>
  );

  return compact ? card : <li>{card}</li>;
}
