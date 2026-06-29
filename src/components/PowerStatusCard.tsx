"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { PowerStatus } from "@/lib/database.types";
import { powerStatusLabel } from "@/lib/power-status";
import type { ParkAlertStatusOverride } from "@/lib/park-alerts";
import type { PowerOutage, PowerOutageResult } from "@/lib/power-outages";
import type { StatusTone } from "@/components/StatusIcon";
import { type StatusArtId } from "@/components/StatusArt";
import StatusCard from "@/components/StatusCard";

const MANUAL_STYLES: Record<
  PowerStatus["status"],
  { dot: string; badge: string }
> = {
  normal: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  outage: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  },
  planned: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
};

const TONE_BADGE: Record<StatusTone, { dot: string; badge: string }> = {
  ok: MANUAL_STYLES.normal,
  warn: MANUAL_STYLES.planned,
  alert: MANUAL_STYLES.outage,
  info: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  },
};

function OutageRow({ outage }: { outage: PowerOutage }) {
  const restore = outage.estimatedRestoreAt
    ? new Date(outage.estimatedRestoreAt)
    : null;
  return (
    <li className="text-sm">
      <p className="font-medium text-ink">
        {outage.utility}
        {outage.impactedCustomers != null ? (
          <span className="font-normal text-muted">
            {" "}
            · {outage.impactedCustomers.toLocaleString()} customers
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted">
        ~{outage.distanceMiles} mi away
        {outage.county ? ` · ${outage.county} County` : ""}
        {restore ? ` · back ~${format(restore, "MMM d, h:mm a")}` : ""}
      </p>
      {outage.cause ? (
        <p className="mt-0.5 text-xs text-muted">{outage.cause}</p>
      ) : null}
    </li>
  );
}

export default function PowerStatusCard({
  manualStatus,
  alertStatus,
}: {
  manualStatus: PowerStatus;
  alertStatus?: ParkAlertStatusOverride | null;
}) {
  const [result, setResult] = useState<PowerOutageResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/power/outages")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as PowerOutageResult;
      })
      .then((json) => {
        if (!cancelled) setResult(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const manualStyles = MANUAL_STYLES[manualStatus.status];
  const outages = result?.outages ?? [];
  const manualRestore = manualStatus.expected_restore_at
    ? new Date(manualStatus.expected_restore_at)
    : null;

  let headerTone: StatusTone = "ok";
  let headerArt: StatusArtId = "power-ok";
  if (alertStatus) {
    headerTone = alertStatus.tone;
    headerArt = alertStatus.art;
  } else if (manualStatus.status === "outage") {
    headerTone = "alert";
    headerArt = "power-issue";
  } else if (manualStatus.status === "planned") {
    headerTone = "warn";
    headerArt = "power-issue";
  } else if (outages.length > 0) {
    headerTone = "warn";
    headerArt = "power-issue";
  }

  const showManualBlock =
    manualStatus.status !== "normal" && !alertStatus;
  const alertEnds = alertStatus?.endsAt
    ? format(new Date(alertStatus.endsAt), "EEE, MMM d · h:mm a")
    : null;
  const badgeStyles = alertStatus
    ? TONE_BADGE[alertStatus.tone]
    : manualStyles;

  return (
    <StatusCard
      tone={headerTone}
      art={headerArt}
      title="Power"
      crop={false}
      headerRight={
        <a
          href="https://www.sce.com/outages-safety/outage-center/check-outage-status"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          SCE outages →
        </a>
      }
    >
      {alertStatus ? (
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles.badge}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${badgeStyles.dot}`}
              aria-hidden
            />
            {alertStatus.statusLabel}
          </span>
          {alertEnds ? (
            <p className="mt-1 text-xs text-muted">Alert ends {alertEnds}</p>
          ) : null}
        </div>
      ) : null}

      {showManualBlock ? (
        <div className={alertStatus ? "mt-2" : ""}>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${manualStyles.badge}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${manualStyles.dot}`}
              aria-hidden
            />
            {powerStatusLabel(manualStatus.status)} (park)
          </span>
          {manualStatus.note ? (
            <p className="mt-2 text-sm text-ink">{manualStatus.note}</p>
          ) : null}
          {manualRestore ? (
            <p className="mt-1 text-xs text-muted">
              Expected back {format(manualRestore, "EEE, MMM d · h:mm a")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className={`border-t border-black/10 pt-3 dark:border-white/10 ${
          alertStatus || showManualBlock ? "mt-3" : ""
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Outages at the park
        </p>
        {loading ? (
          <p className="mt-2 text-sm text-muted">Checking…</p>
        ) : error ? (
          <p className="mt-2 text-sm text-muted">
            Live outage data unavailable right now.
          </p>
        ) : outages.length === 0 ? (
          <p className="mt-2 text-sm text-ink">
            No outages reported at the park.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {outages.slice(0, 3).map((outage) => (
              <OutageRow key={outage.id} outage={outage} />
            ))}
            {outages.length > 3 ? (
              <li className="text-xs text-muted">
                +{outages.length - 3} more nearby
              </li>
            ) : null}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted">
          Source: Cal OES, ~3 mi around the park.
        </p>
      </div>
    </StatusCard>
  );
}
