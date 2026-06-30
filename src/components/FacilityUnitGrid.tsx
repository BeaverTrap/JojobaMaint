import type { ReactNode } from "react";
import type { FacilityUnitState } from "@/lib/database.types";
import {
  setAllUnits,
  statesSummary,
  statesTone,
  toggleUnitAt,
} from "@/lib/facility-unit-states";

export type FacilityUnitKind =
  | "washer"
  | "dryer"
  | "pet-washer"
  | "water-heater"
  | "shower"
  | "toilet"
  | "urinal"
  | "sink"
  | "kitchen-sink"
  | "oven";

const OK_DOT =
  "border-emerald-400 bg-emerald-400/80 dark:border-emerald-500 dark:bg-emerald-500/70";
const OUT_DOT =
  "border-red-500 bg-red-500/90 ring-1 ring-red-300 dark:border-red-400 dark:bg-red-600/90";
const CLOSED_DOT =
  "border-slate-400 bg-slate-400/70 dark:border-slate-500 dark:bg-slate-600/70";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function UnitIcon({
  kind,
  className = "h-3.5 w-3.5",
}: {
  kind: FacilityUnitKind;
  className?: string;
}) {
  switch (kind) {
    case "washer":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "dryer":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="13" r="4" />
          <path d="M9 7h6" />
        </svg>
      );
    case "pet-washer":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <circle cx="9" cy="14" r="2.5" />
          <path d="M14 12c1.5-1 3-1 4 0" />
          <path d="M16 15c.8.8 1.5 1.2 2.5 1.2" />
        </svg>
      );
    case "water-heater":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <rect x="7" y="4" width="10" height="16" rx="2" />
          <path d="M10 9h4M10 13h4M10 17h4" />
        </svg>
      );
    case "shower":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <path d="M12 3v3" />
          <path d="M8 6h8" />
          <path d="M7 9c0 3 2 5 5 5s5-2 5-5" />
          <path d="M9 14v2M12 14v3M15 14v2" />
        </svg>
      );
    case "toilet":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <path d="M9 4h6v3H9z" />
          <path d="M8 7h8v3c0 3-1.5 5-4 5s-4-2-4-5V7z" />
          <path d="M7 15h10v2H7z" />
        </svg>
      );
    case "urinal":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <path d="M10 4h4v4l-2 12H12L10 8V4z" />
        </svg>
      );
    case "sink":
    case "kitchen-sink":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <path d="M6 10h12v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6z" />
          <path d="M12 6v4" />
          <path d="M10 6h4" />
        </svg>
      );
    case "oven":
      return (
        <svg className={className} {...svgProps} aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <rect x="7" y="10" width="10" height="6" rx="1" />
          <path d="M8 7h.01M11 7h.01M14 7h.01" />
        </svg>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function summaryTone(
  statuses: FacilityUnitState[],
  roomClosed: boolean,
): string {
  if (roomClosed) return "text-red-700 dark:text-red-300";
  const tone = statesTone(statuses);
  if (tone === "ok") return "text-emerald-700 dark:text-emerald-300";
  if (tone === "alert") return "text-red-700 dark:text-red-300";
  return "text-amber-700 dark:text-amber-300";
}

/** One row: icon, label, numbered dot per physical unit. */
export function FacilityUnitRow({
  kind,
  label,
  singular,
  statuses,
  roomClosed = false,
}: {
  kind: FacilityUnitKind;
  label: string;
  singular: string;
  statuses: FacilityUnitState[];
  roomClosed?: boolean;
}) {
  if (statuses.length === 0) return null;

  const summary = roomClosed ? "Closed" : statesSummary(statuses, singular);

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="mt-0.5 shrink-0 text-muted">
        <UnitIcon kind={kind} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-medium text-ink">{label}</span>
          <span
            className={`shrink-0 text-[10px] font-medium ${summaryTone(statuses, roomClosed)}`}
          >
            {summary}
          </span>
        </div>
        <div
          className="mt-1 flex flex-wrap gap-1.5"
          role="img"
          aria-label={`${label}: ${summary}`}
        >
          {statuses.map((status, index) => {
            const unitLabel = `${singular} ${index + 1}`;
            const dotClass = roomClosed
              ? CLOSED_DOT
              : status === "out"
                ? OUT_DOT
                : OK_DOT;
            const stateLabel = roomClosed
              ? "closed"
              : status === "out"
                ? "out of order"
                : "open";

            return (
              <span
                key={`${kind}-${index}`}
                className="flex flex-col items-center gap-0.5"
                title={`${unitLabel} — ${stateLabel}`}
              >
                <span
                  className={`h-3 w-3 rounded-sm border ${dotClass}`}
                  aria-hidden
                />
                <span className="text-[9px] font-medium text-muted">
                  {index + 1}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Admin: tap each numbered unit to toggle open / out. */
export function UnitStatusPicker({
  singular,
  statuses,
  onChange,
  disabled = false,
}: {
  singular: string;
  statuses: FacilityUnitState[];
  onChange: (next: FacilityUnitState[]) => void;
  disabled?: boolean;
}) {
  if (statuses.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status, index) => (
          <button
            key={`${singular}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toggleUnitAt(statuses, index))}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              status === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            {singular} {index + 1}: {status === "ok" ? "Open" : "Out"}
          </button>
        ))}
      </div>
      {statuses.length > 1 ? (
        <div className="flex flex-wrap gap-3 text-xs font-medium">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(setAllUnits(statuses, "ok"))}
            className="text-emerald-700 hover:underline disabled:opacity-50 dark:text-emerald-300"
          >
            Mark all open
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(setAllUnits(statuses, "out"))}
            className="text-red-700 hover:underline disabled:opacity-50 dark:text-red-300"
          >
            Mark all out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function FacilitySectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 mt-2 first:mt-0 text-[10px] font-bold uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}
