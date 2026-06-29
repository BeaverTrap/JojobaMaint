export type UnitTone = "ok" | "warn" | "alert";

export type FacilityUnit = {
  label: string;
  count: number;
  outOfOrder: number;
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

export function groupTone(units: FacilityUnit[]): UnitTone {
  let tone: UnitTone = "ok";
  for (const unit of units) {
    const status = unitOutageStatus(unit.count, unit.outOfOrder, unit.label);
    if (!status || status.tone === "ok") continue;
    if (status.tone === "alert") return "alert";
    tone = "warn";
  }
  return tone;
}
