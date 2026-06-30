import type { FacilityUnitState } from "@/lib/facility-unit-states";
import { countOut } from "@/lib/facility-unit-states";

export type UnitTone = "ok" | "warn" | "alert";

export type FacilityUnit = {
  label: string;
  statuses: FacilityUnitState[];
};

/** Human label for one or more units out of commission. */
export function unitOutageStatus(
  count: number,
  outOfOrder: number,
  singular: string,
  plural?: string,
): { tone: UnitTone; text: string } | null {
  if (count === 0) return null;

  const pluralLabel = plural ?? `${singular}s`;
  const working = count - outOfOrder;

  if (outOfOrder === 0) {
    return { tone: "ok", text: "OK" };
  }

  if (outOfOrder >= count) {
    return {
      tone: "alert",
      text:
        count === 1
          ? `${singular} down`
          : `All ${outOfOrder} ${pluralLabel} down`,
    };
  }

  const unitLabel = outOfOrder === 1 ? singular : pluralLabel;
  return {
    tone: "warn",
    text: `${outOfOrder} ${unitLabel} down · ${working} open`,
  };
}

export function unitOutageFromStates(
  statuses: FacilityUnitState[],
  singular: string,
  plural?: string,
): { tone: UnitTone; text: string } | null {
  return unitOutageStatus(
    statuses.length,
    countOut(statuses),
    singular,
    plural,
  );
}

export function groupTone(
  units: FacilityUnit[],
  closed = false,
): UnitTone {
  if (closed) return "alert";
  let tone: UnitTone = "ok";
  for (const unit of units) {
    const status = unitOutageFromStates(unit.statuses, unit.label);
    if (!status || status.tone === "ok") continue;
    if (status.tone === "alert") return "alert";
    tone = "warn";
  }
  return tone;
}
