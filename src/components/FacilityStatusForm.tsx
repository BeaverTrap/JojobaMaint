"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FacilityUnitState, ParkFacilityBuilding } from "@/lib/database.types";
import { UnitStatusPicker } from "@/components/FacilityUnitGrid";
import { countOut } from "@/lib/facility-unit-states";

type BuildingDraft = {
  washer_statuses: FacilityUnitState[];
  dryer_statuses: FacilityUnitState[];
  pet_washer_statuses: FacilityUnitState[];
  water_heater_statuses: FacilityUnitState[];
  kitchen_sink_statuses: FacilityUnitState[];
  oven_statuses: FacilityUnitState[];
  laundry_note: string;
  pet_washer_note: string;
  water_heater_note: string;
  kitchen_note: string;
  note: string;
};

type RestroomDraft = {
  shower_statuses: FacilityUnitState[];
  stall_statuses: FacilityUnitState[];
  urinal_statuses: FacilityUnitState[];
  sink_statuses: FacilityUnitState[];
  closed: boolean;
  note: string;
};

function NoteField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
      />
    </label>
  );
}

function UnitPickerSection({
  title,
  singular,
  statuses,
  onChange,
  disabled,
}: {
  title: string;
  singular: string;
  statuses: FacilityUnitState[];
  onChange: (next: FacilityUnitState[]) => void;
  disabled?: boolean;
}) {
  if (statuses.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{title}</p>
      <UnitStatusPicker
        singular={singular}
        statuses={statuses}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function FacilityStatusForm({
  initial,
}: {
  initial: ParkFacilityBuilding[];
}) {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Record<string, BuildingDraft>>(() =>
    Object.fromEntries(
      initial.map((building) => [
        building.id,
        {
          washer_statuses: [...building.washer_statuses],
          dryer_statuses: [...building.dryer_statuses],
          pet_washer_statuses: [...building.pet_washer_statuses],
          water_heater_statuses: [...building.water_heater_statuses],
          kitchen_sink_statuses: [...building.kitchen_sink_statuses],
          oven_statuses: [...building.oven_statuses],
          laundry_note: building.laundry_note ?? "",
          pet_washer_note: building.pet_washer_note ?? "",
          water_heater_note: building.water_heater_note ?? "",
          kitchen_note: building.kitchen_note ?? "",
          note: building.note ?? "",
        },
      ]),
    ),
  );
  const [restrooms, setRestrooms] = useState<Record<string, RestroomDraft>>(() =>
    Object.fromEntries(
      initial.flatMap((building) =>
        building.restrooms.map((room) => [
          room.id,
          {
            shower_statuses: [...room.shower_statuses],
            stall_statuses: [...room.stall_statuses],
            urinal_statuses: [...room.urinal_statuses],
            sink_statuses: [...room.sink_statuses],
            closed: room.closed,
            note: room.note ?? "",
          },
        ]),
      ),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateBuilding(id: string, patch: Partial<BuildingDraft>) {
    setBuildings((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  function updateRestroom(id: string, patch: Partial<RestroomDraft>) {
    setRestrooms((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      for (const building of initial) {
        const draft = buildings[building.id];
        if (!draft) continue;

        const { error: updateError } = await supabase
          .from("park_facility_status")
          .update({
            washer_statuses: draft.washer_statuses,
            dryer_statuses: draft.dryer_statuses,
            pet_washer_statuses: draft.pet_washer_statuses,
            water_heater_statuses: draft.water_heater_statuses,
            kitchen_sink_statuses: draft.kitchen_sink_statuses,
            oven_statuses: draft.oven_statuses,
            laundry_note: draft.laundry_note.trim() || null,
            pet_washer_note: draft.pet_washer_note.trim() || null,
            water_heater_note: draft.water_heater_note.trim() || null,
            kitchen_note: draft.kitchen_note.trim() || null,
            note: draft.note.trim() || null,
            updated_by: user.id,
          })
          .eq("id", building.id);
        if (updateError) throw updateError;

        for (const room of building.restrooms) {
          const roomDraft = restrooms[room.id];
          if (!roomDraft) continue;

          const { error: roomError } = await supabase
            .from("park_restroom_status")
            .update({
              shower_statuses: roomDraft.shower_statuses,
              stall_statuses: roomDraft.stall_statuses,
              urinal_statuses: roomDraft.urinal_statuses,
              sink_statuses: roomDraft.sink_statuses,
              closed: roomDraft.closed,
              note: roomDraft.note.trim() || null,
              updated_by: user.id,
            })
            .eq("id", room.id);
          if (roomError) throw roomError;
        }
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save facility status.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initial.map((building) => {
        const draft = buildings[building.id];
        if (!draft) return null;

        const hasLaundry =
          building.washer_count > 0 ||
          building.dryer_count > 0 ||
          building.pet_washer_count > 0;
        const hasKitchen =
          building.kitchen_sink_count > 0 || building.oven_count > 0;
        const hasHotWater = building.water_heater_count > 0;

        const laundryHasIssue =
          countOut(draft.washer_statuses) > 0 ||
          countOut(draft.dryer_statuses) > 0 ||
          countOut(draft.pet_washer_statuses) > 0;

        return (
          <fieldset
            key={building.id}
            className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <legend className="px-1 text-base font-semibold text-ink">
              {building.label}
            </legend>

            {hasLaundry ? (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Laundry
                </p>
                <UnitPickerSection
                  title="Washers"
                  singular="Washer"
                  statuses={draft.washer_statuses}
                  onChange={(washer_statuses) =>
                    updateBuilding(building.id, { washer_statuses })
                  }
                />
                <UnitPickerSection
                  title="Dryers"
                  singular="Dryer"
                  statuses={draft.dryer_statuses}
                  onChange={(dryer_statuses) =>
                    updateBuilding(building.id, { dryer_statuses })
                  }
                />
                <UnitPickerSection
                  title="Outside pet washer"
                  singular="Pet washer"
                  statuses={draft.pet_washer_statuses}
                  onChange={(pet_washer_statuses) =>
                    updateBuilding(building.id, { pet_washer_statuses })
                  }
                />
                {laundryHasIssue ? (
                  <>
                    <NoteField
                      label="Laundry details (optional)"
                      value={draft.laundry_note}
                      onChange={(value) =>
                        updateBuilding(building.id, { laundry_note: value })
                      }
                      placeholder="e.g. Washer 3 — coin mechanism stuck"
                    />
                    {building.pet_washer_count > 0 ? (
                      <NoteField
                        label="Pet washer details (optional)"
                        value={draft.pet_washer_note}
                        onChange={(value) =>
                          updateBuilding(building.id, { pet_washer_note: value })
                        }
                        placeholder="e.g. Outside pet washer leaking"
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            {hasHotWater ? (
              <div className="space-y-4 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Hot water
                </p>
                <UnitPickerSection
                  title="Water heater"
                  singular="Water heater"
                  statuses={draft.water_heater_statuses}
                  onChange={(water_heater_statuses) =>
                    updateBuilding(building.id, { water_heater_statuses })
                  }
                />
                {countOut(draft.water_heater_statuses) > 0 ? (
                  <NoteField
                    label="Hot water details (optional)"
                    value={draft.water_heater_note}
                    onChange={(value) =>
                      updateBuilding(building.id, { water_heater_note: value })
                    }
                    placeholder="e.g. No hot water in showers"
                  />
                ) : null}
              </div>
            ) : null}

            {hasKitchen ? (
              <div className="space-y-4 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Ranch House kitchen
                </p>
                <UnitPickerSection
                  title="Kitchen sink"
                  singular="Kitchen sink"
                  statuses={draft.kitchen_sink_statuses}
                  onChange={(kitchen_sink_statuses) =>
                    updateBuilding(building.id, { kitchen_sink_statuses })
                  }
                />
                <UnitPickerSection
                  title="Oven"
                  singular="Oven"
                  statuses={draft.oven_statuses}
                  onChange={(oven_statuses) =>
                    updateBuilding(building.id, { oven_statuses })
                  }
                />
                {countOut(draft.kitchen_sink_statuses) > 0 ||
                countOut(draft.oven_statuses) > 0 ? (
                  <NoteField
                    label="Kitchen details (optional)"
                    value={draft.kitchen_note}
                    onChange={(value) =>
                      updateBuilding(building.id, { kitchen_note: value })
                    }
                    placeholder="e.g. Oven not heating"
                  />
                ) : null}
              </div>
            ) : null}

            {building.restrooms.map((room) => {
              const roomDraft = restrooms[room.id];
              if (!roomDraft) return null;

              const roomHasIssue =
                roomDraft.closed ||
                countOut(roomDraft.shower_statuses) > 0 ||
                countOut(roomDraft.stall_statuses) > 0 ||
                countOut(roomDraft.urinal_statuses) > 0 ||
                countOut(roomDraft.sink_statuses) > 0;

              return (
                <div
                  key={room.id}
                  className="space-y-4 border-t border-line pt-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      {room.label}
                    </p>
                    <label className="flex items-center gap-2 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={roomDraft.closed}
                        onChange={(event) =>
                          updateRestroom(room.id, { closed: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-line"
                      />
                      Bathroom closed
                    </label>
                  </div>

                  <UnitPickerSection
                    title="Showers"
                    singular="Shower"
                    statuses={roomDraft.shower_statuses}
                    disabled={roomDraft.closed}
                    onChange={(shower_statuses) =>
                      updateRestroom(room.id, { shower_statuses })
                    }
                  />
                  <UnitPickerSection
                    title="Toilets"
                    singular="Toilet"
                    statuses={roomDraft.stall_statuses}
                    disabled={roomDraft.closed}
                    onChange={(stall_statuses) =>
                      updateRestroom(room.id, { stall_statuses })
                    }
                  />
                  <UnitPickerSection
                    title="Urinals"
                    singular="Urinal"
                    statuses={roomDraft.urinal_statuses}
                    disabled={roomDraft.closed}
                    onChange={(urinal_statuses) =>
                      updateRestroom(room.id, { urinal_statuses })
                    }
                  />
                  <UnitPickerSection
                    title="Sinks"
                    singular="Sink"
                    statuses={roomDraft.sink_statuses}
                    disabled={roomDraft.closed}
                    onChange={(sink_statuses) =>
                      updateRestroom(room.id, { sink_statuses })
                    }
                  />

                  {roomHasIssue ? (
                    <NoteField
                      label="Restroom details (optional)"
                      value={roomDraft.note}
                      onChange={(value) =>
                        updateRestroom(room.id, { note: value })
                      }
                      placeholder={
                        roomDraft.closed
                          ? "e.g. Bathroom closed for cleaning until 2pm"
                          : "e.g. Toilet 2 clogged; Shower 1 no hot water"
                      }
                    />
                  ) : null}
                </div>
              );
            })}

            <div className="border-t border-line pt-4">
              <NoteField
                label="Building note (optional)"
                value={draft.note}
                onChange={(value) => updateBuilding(building.id, { note: value })}
                placeholder="Anything else residents should know about this building"
              />
            </div>
          </fieldset>
        );
      })}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Facility status saved.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save facility status"}
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          View home page →
        </Link>
      </div>
    </form>
  );
}
