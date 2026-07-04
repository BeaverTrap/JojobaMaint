import type {
  ParkFacilityBuilding,
  ParkRestroomStatus,
} from "@/lib/database.types";
import {
  FacilitySectionLabel,
  FacilityUnitRow,
} from "@/components/FacilityUnitGrid";
import { countOut } from "@/lib/facility-unit-states";
import {
  facilityIssueSummary,
  facilityLocationTone,
} from "@/lib/facility-status";

type Tone = "ok" | "warn" | "alert";

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

function DetailNote({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <p className="mt-1 border-l-2 border-amber-400/60 pl-2 text-[11px] leading-snug text-muted dark:border-amber-500/40">
      {text.trim()}
    </p>
  );
}

function RestroomBlock({ room }: { room: ParkRestroomStatus }) {
  const hasIssue =
    room.closed ||
    countOut(room.shower_statuses) > 0 ||
    countOut(room.stall_statuses) > 0 ||
    countOut(room.urinal_statuses) > 0 ||
    countOut(room.sink_statuses) > 0;

  return (
    <div className="rounded-lg bg-white/50 px-2 py-1.5 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-ink">{room.label}</p>
        {room.closed ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800 dark:bg-red-950/50 dark:text-red-200">
            Closed
          </span>
        ) : null}
      </div>
      <FacilityUnitRow
        kind="shower"
        label="Showers"
        singular="Shower"
        statuses={room.shower_statuses}
        roomClosed={room.closed}
      />
      <FacilityUnitRow
        kind="toilet"
        label="Toilets"
        singular="Toilet"
        statuses={room.stall_statuses}
        roomClosed={room.closed}
      />
      <FacilityUnitRow
        kind="urinal"
        label="Urinals"
        singular="Urinal"
        statuses={room.urinal_statuses}
        roomClosed={room.closed}
      />
      <FacilityUnitRow
        kind="sink"
        label="Sinks"
        singular="Sink"
        statuses={room.sink_statuses}
        roomClosed={room.closed}
      />
      {hasIssue ? <DetailNote text={room.note} /> : null}
    </div>
  );
}

export default function FacilityLocationCard({
  location,
  closedByWater = false,
}: {
  location: ParkFacilityBuilding;
  closedByWater?: boolean;
}) {
  const buildingClosed = location.closed || closedByWater;
  const tone = buildingClosed ? "alert" : facilityLocationTone(location);
  const hasLaundry =
    location.washer_count > 0 ||
    location.dryer_count > 0 ||
    location.pet_washer_count > 0;
  const hasKitchen =
    location.kitchen_sink_count > 0 || location.oven_count > 0;
  const hasHotWater = location.water_heater_count > 0;

  const pillText = buildingClosed ? "Closed" : facilityIssueSummary(location);

  const laundryHasIssue =
    countOut(location.washer_statuses) > 0 ||
    countOut(location.dryer_statuses) > 0 ||
    countOut(location.pet_washer_statuses) > 0;

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

      {buildingClosed ? (
        <p className="mt-1.5 text-[11px] text-muted">
          {closedByWater
            ? "Laundry, restrooms, and hot water — no water"
            : "All laundry, restrooms, and amenities closed"}
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          {hasLaundry ? (
            <div>
              <FacilitySectionLabel>Laundry</FacilitySectionLabel>
              <FacilityUnitRow
                kind="washer"
                label="Washers"
                singular="Washer"
                statuses={location.washer_statuses}
              />
              <FacilityUnitRow
                kind="dryer"
                label="Dryers"
                singular="Dryer"
                statuses={location.dryer_statuses}
              />
              <FacilityUnitRow
                kind="pet-washer"
                label="Outside pet washer"
                singular="Pet washer"
                statuses={location.pet_washer_statuses}
              />
              {laundryHasIssue ? (
                <>
                  <DetailNote text={location.laundry_note} />
                  <DetailNote text={location.pet_washer_note} />
                </>
              ) : null}
            </div>
          ) : null}

          {hasHotWater ? (
            <div>
              <FacilitySectionLabel>Hot water</FacilitySectionLabel>
              <FacilityUnitRow
                kind="water-heater"
                label="Water heater"
                singular="Water heater"
                statuses={location.water_heater_statuses}
              />
              {countOut(location.water_heater_statuses) > 0 ? (
                <DetailNote text={location.water_heater_note} />
              ) : null}
            </div>
          ) : null}

          {hasKitchen ? (
            <div>
              <FacilitySectionLabel>Ranch House kitchen</FacilitySectionLabel>
              <FacilityUnitRow
                kind="kitchen-sink"
                label="Kitchen sink"
                singular="Kitchen sink"
                statuses={location.kitchen_sink_statuses}
              />
              <FacilityUnitRow
                kind="oven"
                label="Oven"
                singular="Oven"
                statuses={location.oven_statuses}
              />
              {countOut(location.kitchen_sink_statuses) > 0 ||
              countOut(location.oven_statuses) > 0 ? (
                <DetailNote text={location.kitchen_note} />
              ) : null}
            </div>
          ) : null}

          {location.restrooms.length > 0 ? (
            <div>
              <FacilitySectionLabel>Restrooms</FacilitySectionLabel>
              <div className="space-y-1">
                {location.restrooms.map((room) => (
                  <RestroomBlock key={room.id} room={room} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!buildingClosed && location.note ? (
        <DetailNote text={location.note} />
      ) : null}
    </div>
  );
}
