"use client";

import { useState } from "react";
import { MdExpandMore } from "react-icons/md";
import type {
  ParkFacilityBuilding,
  ParkRestroomStatus,
} from "@/lib/database.types";
import StatusArt, { type StatusArtId } from "@/components/StatusArt";
import {
  facilityIssueSummary,
  facilityLocationTone,
  kitchenTone,
  laundryTone,
  restroomsTone,
  waterHeaterTone,
} from "@/lib/facility-status";
import {
  groupTone,
  unitOutageStatus,
  type FacilityUnit,
  type UnitTone,
} from "@/lib/facility-unit-status";

type Tone = UnitTone;

const TONE_CARD: Record<Tone, string> = {
  ok: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20",
  warn: "border-amber-300 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20",
  alert: "border-red-300 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/25",
};

const DOT: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  alert: "bg-red-500",
};

const PILL: Record<Tone, string> = {
  ok: "text-emerald-700 dark:text-emerald-300",
  warn: "text-amber-700 dark:text-amber-300",
  alert: "text-red-700 dark:text-red-300",
};

const STATUS_BADGE: Record<Tone, string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  alert: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
};

function unitsOut(units: FacilityUnit[]): number {
  return units.reduce((sum, unit) => sum + unit.outOfOrder, 0);
}

function collapsedGroupSummary(units: FacilityUnit[]): string {
  const active = units.filter((unit) => unit.count > 0);
  const out = unitsOut(active);
  if (out === 0) return "All open";
  if (out === 1) {
    const issue = active.find((unit) => unit.outOfOrder > 0);
    if (issue) {
      const status = unitOutageStatus(
        issue.count,
        issue.outOfOrder,
        issue.label,
      );
      return status?.text ?? "1 down";
    }
  }
  return `${out} down`;
}

function UnitStatusRow({
  singular,
  plural,
  count,
  outOfOrder,
}: {
  singular: string;
  plural?: string;
  count: number;
  outOfOrder: number;
}) {
  if (count === 0) return null;

  const status = unitOutageStatus(count, outOfOrder, singular, plural);
  if (!status) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-[11px] text-ink">{plural ?? `${singular}s`}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[status.tone]}`}
      >
        {status.text}
      </span>
    </div>
  );
}

function DetailNote({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <p className="mt-1 border-l-2 border-amber-400/60 pl-2 text-[11px] leading-snug text-muted dark:border-amber-500/40">
      {text.trim()}
    </p>
  );
}

function CollapsibleSection({
  art,
  tone,
  title,
  summary,
  defaultExpanded,
  children,
}: {
  art: StatusArtId;
  tone: Tone;
  title: string;
  summary: string;
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-line/60 bg-white/40 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-white/50 dark:hover:bg-white/10"
      >
        <StatusArt art={art} tone={tone} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
            {title}
          </span>
          {!expanded ? (
            <span className={`text-[11px] font-medium ${PILL[tone]}`}>
              {summary}
            </span>
          ) : null}
        </span>
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[tone]}`}
          aria-hidden
        />
        <MdExpandMore
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {expanded ? <div className="border-t border-line/50 px-2 py-1">{children}</div> : null}
    </div>
  );
}

function UnitGroup({
  art,
  title,
  units,
  note,
  extraNote,
  defaultExpanded,
}: {
  art: StatusArtId;
  title: string;
  units: FacilityUnit[];
  note?: string | null;
  extraNote?: string | null;
  defaultExpanded: boolean;
}) {
  const activeUnits = units.filter((u) => u.count > 0);
  if (activeUnits.length === 0) return null;

  const tone = groupTone(activeUnits);
  const hasIssue = tone !== "ok";

  return (
    <CollapsibleSection
      art={art}
      tone={tone}
      title={title}
      summary={collapsedGroupSummary(activeUnits)}
      defaultExpanded={defaultExpanded}
    >
      {activeUnits.map((unit) => (
        <UnitStatusRow
          key={unit.label}
          singular={unit.label}
          count={unit.count}
          outOfOrder={unit.outOfOrder}
        />
      ))}
      {hasIssue ? <DetailNote text={note} /> : null}
      {hasIssue ? <DetailNote text={extraNote} /> : null}
    </CollapsibleSection>
  );
}

function RestroomBlock({ room }: { room: ParkRestroomStatus }) {
  const units: FacilityUnit[] = [
    { label: "shower", count: room.shower_count, outOfOrder: room.showers_out_of_order },
    { label: "toilet", count: room.stall_count, outOfOrder: room.stalls_out_of_order },
    { label: "urinal", count: room.urinal_count, outOfOrder: room.urinals_out_of_order },
    { label: "sink", count: room.sink_count, outOfOrder: room.sinks_out_of_order },
  ];
  const tone = groupTone(units.filter((u) => u.count > 0));
  const hasIssue = tone !== "ok";

  return (
    <div className="rounded-lg bg-white/50 px-2 py-1 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-ink">{room.label}</span>
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[tone]}`}
          aria-hidden
        />
      </div>
      {units
        .filter((u) => u.count > 0)
        .map((unit) => (
          <UnitStatusRow
            key={unit.label}
            singular={unit.label}
            count={unit.count}
            outOfOrder={unit.outOfOrder}
          />
        ))}
      {hasIssue ? <DetailNote text={room.note} /> : null}
    </div>
  );
}

function RestroomsGroup({
  location,
  defaultExpanded,
}: {
  location: ParkFacilityBuilding;
  defaultExpanded: boolean;
}) {
  if (location.restrooms.length === 0) return null;

  const units: FacilityUnit[] = location.restrooms.flatMap((room) => [
    { label: "shower", count: room.shower_count, outOfOrder: room.showers_out_of_order },
    { label: "toilet", count: room.stall_count, outOfOrder: room.stalls_out_of_order },
    { label: "urinal", count: room.urinal_count, outOfOrder: room.urinals_out_of_order },
    { label: "sink", count: room.sink_count, outOfOrder: room.sinks_out_of_order },
  ]);
  const tone = restroomsTone(location);
  const roomCount = location.restrooms.length;
  const summary =
    tone === "ok"
      ? `${roomCount} room${roomCount === 1 ? "" : "s"} · all open`
      : collapsedGroupSummary(units.filter((unit) => unit.count > 0));

  return (
    <CollapsibleSection
      art={tone === "ok" ? "bathroom-ok" : "bathroom-issue"}
      tone={tone}
      title="Restrooms"
      summary={summary}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-1">
        {location.restrooms.map((room) => (
          <RestroomBlock key={room.id} room={room} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default function FacilityLocationCard({
  location,
  closedByWater = false,
}: {
  location: ParkFacilityBuilding;
  closedByWater?: boolean;
}) {
  const tone = closedByWater ? "alert" : facilityLocationTone(location);
  const hasLaundry = location.washer_count > 0 || location.dryer_count > 0;
  const hasKitchen =
    location.kitchen_sink_count > 0 || location.oven_count > 0;
  const hasHotWater = location.water_heater_count > 0;
  const lTone = laundryTone(location);
  const kTone = kitchenTone(location);
  const rTone = restroomsTone(location);
  const hTone = waterHeaterTone(location);

  const pillText = closedByWater
    ? "Closed"
    : facilityIssueSummary(location);

  const expandLaundry = lTone !== "ok";
  const expandRestrooms = rTone !== "ok";

  return (
    <div className={`rounded-xl border px-3 py-2.5 shadow-sm ${TONE_CARD[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-bold text-ink">{location.label}</h3>
        <span
          className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${PILL[tone]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden />
          {pillText}
        </span>
      </div>

      {closedByWater ? (
        <p className="mt-1.5 text-[11px] text-muted">
          Laundry, restrooms, and hot water — no water
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {hasLaundry ? (
            <UnitGroup
              art={lTone === "ok" ? "laundry-ok" : "laundry-issue"}
              title="Laundry"
              defaultExpanded={expandLaundry}
              units={[
                {
                  label: "washer",
                  count: location.washer_count,
                  outOfOrder: location.washers_out_of_order,
                },
                {
                  label: "dryer",
                  count: location.dryer_count,
                  outOfOrder: location.dryers_out_of_order,
                },
                {
                  label: "pet washer",
                  count: location.pet_washer_count,
                  outOfOrder: location.pet_washers_out_of_order,
                },
              ]}
              note={location.laundry_note}
              extraNote={location.pet_washer_note}
            />
          ) : null}

          {hasHotWater ? (
            <UnitGroup
              art={hTone === "ok" ? "info" : "alert"}
              title="Hot water"
              defaultExpanded={hTone !== "ok"}
              units={[
                {
                  label: "water heater",
                  count: location.water_heater_count,
                  outOfOrder: location.water_heaters_out_of_order,
                },
              ]}
              note={location.water_heater_note}
            />
          ) : null}

          {hasKitchen ? (
            <UnitGroup
              art={kTone === "ok" ? "info" : "alert"}
              title="Ranch House kitchen"
              defaultExpanded={kTone !== "ok"}
              units={[
                {
                  label: "kitchen sink",
                  count: location.kitchen_sink_count,
                  outOfOrder: location.kitchen_sinks_out_of_order,
                },
                {
                  label: "oven",
                  count: location.oven_count,
                  outOfOrder: location.ovens_out_of_order,
                },
              ]}
              note={location.kitchen_note}
            />
          ) : null}

          <RestroomsGroup
            location={location}
            defaultExpanded={expandRestrooms}
          />
        </div>
      )}

      {!closedByWater && location.note ? (
        <DetailNote text={location.note} />
      ) : null}
    </div>
  );
}
