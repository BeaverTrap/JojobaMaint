"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ParkFacilityBuilding } from "@/lib/database.types";

type BuildingDraft = {
  washers_out_of_order: number;
  dryers_out_of_order: number;
  pet_washers_out_of_order: number;
  water_heaters_out_of_order: number;
  kitchen_sinks_out_of_order: number;
  ovens_out_of_order: number;
  laundry_note: string;
  pet_washer_note: string;
  water_heater_note: string;
  kitchen_note: string;
  note: string;
};

type RestroomDraft = {
  showers_out_of_order: number;
  stalls_out_of_order: number;
  urinals_out_of_order: number;
  sinks_out_of_order: number;
  note: string;
};

function clamp(value: number, max: number): number {
  return Math.min(Math.max(0, value), max);
}

function OooField({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  if (max === 0) return null;

  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
      />
    </label>
  );
}

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
          washers_out_of_order: building.washers_out_of_order,
          dryers_out_of_order: building.dryers_out_of_order,
          pet_washers_out_of_order: building.pet_washers_out_of_order,
          water_heaters_out_of_order: building.water_heaters_out_of_order,
          kitchen_sinks_out_of_order: building.kitchen_sinks_out_of_order,
          ovens_out_of_order: building.ovens_out_of_order,
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
            showers_out_of_order: room.showers_out_of_order,
            stalls_out_of_order: room.stalls_out_of_order,
            urinals_out_of_order: room.urinals_out_of_order,
            sinks_out_of_order: room.sinks_out_of_order,
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
            washers_out_of_order: clamp(
              draft.washers_out_of_order,
              building.washer_count,
            ),
            dryers_out_of_order: clamp(
              draft.dryers_out_of_order,
              building.dryer_count,
            ),
            pet_washers_out_of_order: clamp(
              draft.pet_washers_out_of_order,
              building.pet_washer_count,
            ),
            water_heaters_out_of_order: clamp(
              draft.water_heaters_out_of_order,
              building.water_heater_count,
            ),
            kitchen_sinks_out_of_order: clamp(
              draft.kitchen_sinks_out_of_order,
              building.kitchen_sink_count,
            ),
            ovens_out_of_order: clamp(
              draft.ovens_out_of_order,
              building.oven_count,
            ),
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
              showers_out_of_order: clamp(
                roomDraft.showers_out_of_order,
                room.shower_count,
              ),
              stalls_out_of_order: clamp(
                roomDraft.stalls_out_of_order,
                room.stall_count,
              ),
              urinals_out_of_order: clamp(
                roomDraft.urinals_out_of_order,
                room.urinal_count,
              ),
              sinks_out_of_order: clamp(
                roomDraft.sinks_out_of_order,
                room.sink_count,
              ),
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

        return (
          <fieldset
            key={building.id}
            className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <legend className="px-1 text-base font-semibold text-ink">
              {building.label}
            </legend>

            {hasLaundry ? (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Laundry
                </p>
                <p className="text-xs text-muted">
                  {building.washer_count} washers · {building.dryer_count} dryers
                  {building.pet_washer_count > 0
                    ? ` · ${building.pet_washer_count} outside pet washer`
                    : ""}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <OooField
                    label="Washers out of order"
                    max={building.washer_count}
                    value={draft.washers_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, { washers_out_of_order: value })
                    }
                  />
                  <OooField
                    label="Dryers out of order"
                    max={building.dryer_count}
                    value={draft.dryers_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, { dryers_out_of_order: value })
                    }
                  />
                  <OooField
                    label="Outside pet washers out of order"
                    max={building.pet_washer_count}
                    value={draft.pet_washers_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, {
                        pet_washers_out_of_order: value,
                      })
                    }
                  />
                </div>
                <NoteField
                  label="Laundry details (optional)"
                  value={draft.laundry_note}
                  onChange={(value) =>
                    updateBuilding(building.id, { laundry_note: value })
                  }
                  placeholder="e.g. Washer 3 — coin mechanism stuck; Dryer 1 — out of service"
                />
                {building.pet_washer_count > 0 ? (
                  <NoteField
                    label="Outside pet washer details (optional)"
                    value={draft.pet_washer_note}
                    onChange={(value) =>
                      updateBuilding(building.id, { pet_washer_note: value })
                    }
                    placeholder="e.g. Outside pet washer leaking; hose bib shut off"
                  />
                ) : null}
              </div>
            ) : null}

            {hasHotWater ? (
              <div className="space-y-3 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Hot water
                </p>
                <p className="text-xs text-muted">
                  {building.water_heater_count} water heater
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <OooField
                    label="Water heaters out of order"
                    max={building.water_heater_count}
                    value={draft.water_heaters_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, {
                        water_heaters_out_of_order: value,
                      })
                    }
                  />
                </div>
                <NoteField
                  label="Hot water details (optional)"
                  value={draft.water_heater_note}
                  onChange={(value) =>
                    updateBuilding(building.id, { water_heater_note: value })
                  }
                  placeholder="e.g. No hot water in showers; water heater pilot out"
                />
              </div>
            ) : null}

            {hasKitchen ? (
              <div className="space-y-3 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Ranch House kitchen
                </p>
                <p className="text-xs text-muted">
                  {building.kitchen_sink_count} kitchen sink ·{" "}
                  {building.oven_count} oven
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <OooField
                    label="Kitchen sinks out of order"
                    max={building.kitchen_sink_count}
                    value={draft.kitchen_sinks_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, {
                        kitchen_sinks_out_of_order: value,
                      })
                    }
                  />
                  <OooField
                    label="Ovens out of order"
                    max={building.oven_count}
                    value={draft.ovens_out_of_order}
                    onChange={(value) =>
                      updateBuilding(building.id, { ovens_out_of_order: value })
                    }
                  />
                </div>
                <NoteField
                  label="Kitchen details (optional)"
                  value={draft.kitchen_note}
                  onChange={(value) =>
                    updateBuilding(building.id, { kitchen_note: value })
                  }
                  placeholder="e.g. Oven not heating; kitchen sink clogged"
                />
              </div>
            ) : null}

            {building.restrooms.map((room) => {
              const roomDraft = restrooms[room.id];
              if (!roomDraft) return null;

              return (
                <div
                  key={room.id}
                  className="space-y-3 border-t border-line pt-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    {room.label}
                  </p>
                  <p className="text-xs text-muted">
                    {room.shower_count} showers · {room.stall_count} toilets ·{" "}
                    {room.sink_count} sinks
                    {room.urinal_count > 0
                      ? ` · ${room.urinal_count} urinals`
                      : ""}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <OooField
                      label="Showers out of order"
                      max={room.shower_count}
                      value={roomDraft.showers_out_of_order}
                      onChange={(value) =>
                        updateRestroom(room.id, { showers_out_of_order: value })
                      }
                    />
                    <OooField
                      label="Toilets out of order"
                      max={room.stall_count}
                      value={roomDraft.stalls_out_of_order}
                      onChange={(value) =>
                        updateRestroom(room.id, { stalls_out_of_order: value })
                      }
                    />
                    <OooField
                      label="Urinals out of order"
                      max={room.urinal_count}
                      value={roomDraft.urinals_out_of_order}
                      onChange={(value) =>
                        updateRestroom(room.id, { urinals_out_of_order: value })
                      }
                    />
                    <OooField
                      label="Sinks out of order"
                      max={room.sink_count}
                      value={roomDraft.sinks_out_of_order}
                      onChange={(value) =>
                        updateRestroom(room.id, { sinks_out_of_order: value })
                      }
                    />
                  </div>
                  <NoteField
                    label="Restroom details (optional)"
                    value={roomDraft.note}
                    onChange={(value) =>
                      updateRestroom(room.id, { note: value })
                    }
                    placeholder="e.g. Toilet by door clogged; left sink no hot water"
                  />
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
