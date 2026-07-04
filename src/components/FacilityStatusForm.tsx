"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FacilityUnitState, ParkFacilityBuilding } from "@/lib/database.types";
import { countOut } from "@/lib/facility-unit-states";
import { toggleUnitAt, setAllUnits } from "@/lib/facility-unit-states";

type BuildingDraft = {
  closed: boolean;
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

function StatusRow({
  label,
  statuses,
  disabled,
  onChange,
}: {
  label: string;
  statuses: FacilityUnitState[];
  disabled?: boolean;
  onChange: (next: FacilityUnitState[]) => void;
}) {
  if (statuses.length === 0) return null;
  const down = countOut(statuses);

  return (
    <tr className="group/row border-b border-line/50 last:border-0">
      <td className="w-24 py-2 pr-3 align-middle text-xs font-medium text-muted">{label}</td>
      <td className="py-2 align-middle">
        <div className="flex flex-wrap items-center gap-[5px]">
          {statuses.map((s, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(toggleUnitAt(statuses, i))}
              className={`relative inline-flex h-6 min-w-[24px] items-center justify-center rounded-[5px] text-[10px] font-semibold tabular-nums transition-colors duration-100 active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-30 ${
                s === "ok"
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25"
                  : "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-400/15 dark:text-red-300 dark:hover:bg-red-400/25"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </td>
      <td className="w-16 py-2 pl-2 text-right align-middle">
        {statuses.length > 1 ? (
          <div className="flex items-center justify-end gap-1">
            <button type="button" disabled={disabled} onClick={() => onChange(setAllUnits(statuses, "ok"))} className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-30 dark:text-emerald-400">✓</button>
            <button type="button" disabled={disabled} onClick={() => onChange(setAllUnits(statuses, "out"))} className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-500/10 disabled:opacity-30 dark:text-red-400">✕</button>
          </div>
        ) : null}
      </td>
      <td className="w-14 py-2 pl-2 text-right align-middle">
        {down > 0 ? (
          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">{down} down</span>
        ) : (
          <span className="text-[10px] text-muted/60">—</span>
        )}
      </td>
    </tr>
  );
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-red-500" : "bg-gray-300 dark:bg-white/20"
      }`}
    >
      <span className={`inline-block h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[14px]" : "translate-x-[2px]"}`} />
    </button>
  );
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out] rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface shadow-lg">
      {message}
    </div>
  );
}

export default function FacilityStatusForm({ initial }: { initial: ParkFacilityBuilding[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [buildings, setBuildings] = useState<Record<string, BuildingDraft>>(() =>
    Object.fromEntries(
      initial.map((b) => [
        b.id,
        {
          closed: b.closed,
          washer_statuses: [...b.washer_statuses],
          dryer_statuses: [...b.dryer_statuses],
          pet_washer_statuses: [...b.pet_washer_statuses],
          water_heater_statuses: [...b.water_heater_statuses],
          kitchen_sink_statuses: [...b.kitchen_sink_statuses],
          oven_statuses: [...b.oven_statuses],
          laundry_note: b.laundry_note ?? "",
          pet_washer_note: b.pet_washer_note ?? "",
          water_heater_note: b.water_heater_note ?? "",
          kitchen_note: b.kitchen_note ?? "",
          note: b.note ?? "",
        },
      ]),
    ),
  );
  const [restrooms, setRestrooms] = useState<Record<string, RestroomDraft>>(() =>
    Object.fromEntries(
      initial.flatMap((b) =>
        b.restrooms.map((r) => [
          r.id,
          {
            shower_statuses: [...r.shower_statuses],
            stall_statuses: [...r.stall_statuses],
            urinal_statuses: [...r.urinal_statuses],
            sink_statuses: [...r.sink_statuses],
            closed: r.closed,
            note: r.note ?? "",
          },
        ]),
      ),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function updateBuilding(id: string, patch: Partial<BuildingDraft>) {
    setBuildings((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
    setDirty(true);
  }
  function updateRestroom(id: string, patch: Partial<RestroomDraft>) {
    setRestrooms((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
    setDirty(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      for (const building of initial) {
        const d = buildings[building.id];
        if (!d) continue;
        const { error: err } = await supabase
          .from("park_facility_status")
          .update({
            closed: d.closed,
            washer_statuses: d.washer_statuses,
            dryer_statuses: d.dryer_statuses,
            pet_washer_statuses: d.pet_washer_statuses,
            water_heater_statuses: d.water_heater_statuses,
            kitchen_sink_statuses: d.kitchen_sink_statuses,
            oven_statuses: d.oven_statuses,
            laundry_note: d.laundry_note.trim() || null,
            pet_washer_note: d.pet_washer_note.trim() || null,
            water_heater_note: d.water_heater_note.trim() || null,
            kitchen_note: d.kitchen_note.trim() || null,
            note: d.note.trim() || null,
            updated_by: user.id,
          })
          .eq("id", building.id);
        if (err) throw err;

        for (const room of building.restrooms) {
          const rd = restrooms[room.id];
          if (!rd) continue;
          const { error: re } = await supabase
            .from("park_restroom_status")
            .update({
              shower_statuses: rd.shower_statuses,
              stall_statuses: rd.stall_statuses,
              urinal_statuses: rd.urinal_statuses,
              sink_statuses: rd.sink_statuses,
              closed: rd.closed,
              note: rd.note.trim() || null,
              updated_by: user.id,
            })
            .eq("id", room.id);
          if (re) throw re;
        }
      }
      setDirty(false);
      setToast("Saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  const allRestroomsClosed = Object.values(restrooms).every((r) => r.closed);
  const allLaundryClosed = initial
    .filter((b) => b.washer_count > 0 || b.dryer_count > 0 || b.pet_washer_count > 0)
    .every((b) => buildings[b.id]?.closed);

  function closeAllRestrooms(closed: boolean) {
    setRestrooms((c) => Object.fromEntries(Object.entries(c).map(([id, r]) => [id, { ...r, closed }])));
    setDirty(true);
  }
  function closeAllLaundry(closed: boolean) {
    setBuildings((c) => {
      const n = { ...c };
      for (const b of initial) {
        if (b.washer_count > 0 || b.dryer_count > 0 || b.pet_washer_count > 0) n[b.id] = { ...n[b.id], closed };
      }
      return n;
    });
    setDirty(true);
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="pb-20">
        {/* Quick toggles */}
        <div className="mb-6 flex items-center gap-6 text-xs">
          <label className="flex items-center gap-2 font-medium text-ink">
            <Switch checked={allLaundryClosed} onChange={() => closeAllLaundry(!allLaundryClosed)} />
            Close all laundry
          </label>
          <label className="flex items-center gap-2 font-medium text-ink">
            <Switch checked={allRestroomsClosed} onChange={() => closeAllRestrooms(!allRestroomsClosed)} />
            Close all bathrooms
          </label>
        </div>

        {/* Buildings — flat table sections */}
        <div className="space-y-1">
          {initial.map((building) => {
            const draft = buildings[building.id];
            if (!draft) return null;
            const hasLaundry = building.washer_count > 0 || building.dryer_count > 0 || building.pet_washer_count > 0;
            const hasKitchen = building.kitchen_sink_count > 0 || building.oven_count > 0;
            const hasHotWater = building.water_heater_count > 0;

            return (
              <section key={building.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                {/* Section header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[13px] font-semibold text-ink">{building.label}</h3>
                    <span className="text-[10px] text-muted">{timeAgo(building.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {draft.closed ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Closed</span>
                    ) : null}
                    <Switch checked={draft.closed} onChange={(closed) => updateBuilding(building.id, { closed })} />
                  </div>
                </div>

                {/* Body */}
                <div className={`transition-opacity duration-150 ${draft.closed ? "opacity-20 pointer-events-none" : ""}`}>
                  <table className="w-full">
                    <tbody className="divide-y-0">
                      {hasLaundry ? (
                        <>
                          <StatusRow label="Washers" statuses={draft.washer_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { washer_statuses: s })} />
                          <StatusRow label="Dryers" statuses={draft.dryer_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { dryer_statuses: s })} />
                          <StatusRow label="Pet wash" statuses={draft.pet_washer_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { pet_washer_statuses: s })} />
                        </>
                      ) : null}
                      {hasHotWater ? (
                        <StatusRow label="Hot water" statuses={draft.water_heater_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { water_heater_statuses: s })} />
                      ) : null}
                      {hasKitchen ? (
                        <>
                          <StatusRow label="Sinks" statuses={draft.kitchen_sink_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { kitchen_sink_statuses: s })} />
                          <StatusRow label="Ovens" statuses={draft.oven_statuses} disabled={draft.closed} onChange={(s) => updateBuilding(building.id, { oven_statuses: s })} />
                        </>
                      ) : null}
                    </tbody>
                  </table>

                  {/* Restrooms within building */}
                  {building.restrooms.map((room) => {
                    const rd = restrooms[room.id];
                    if (!rd) return null;
                    const roomOff = draft.closed || rd.closed;
                    return (
                      <div key={room.id} className="border-t border-line">
                        <div className="flex items-center justify-between px-4 py-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{room.label}</span>
                          <div className="flex items-center gap-3">
                            {rd.closed ? <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">Closed</span> : null}
                            <Switch checked={rd.closed} onChange={(closed) => updateRestroom(room.id, { closed })} disabled={draft.closed} />
                          </div>
                        </div>
                        <div className={`transition-opacity duration-150 ${roomOff ? "opacity-20 pointer-events-none" : ""}`}>
                          <table className="w-full">
                            <tbody>
                              <StatusRow label="Showers" statuses={rd.shower_statuses} disabled={roomOff} onChange={(s) => updateRestroom(room.id, { shower_statuses: s })} />
                              <StatusRow label="Toilets" statuses={rd.stall_statuses} disabled={roomOff} onChange={(s) => updateRestroom(room.id, { stall_statuses: s })} />
                              <StatusRow label="Urinals" statuses={rd.urinal_statuses} disabled={roomOff} onChange={(s) => updateRestroom(room.id, { urinal_statuses: s })} />
                              <StatusRow label="Sinks" statuses={rd.sink_statuses} disabled={roomOff} onChange={(s) => updateRestroom(room.id, { sink_statuses: s })} />
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </form>

      {/* Sticky save bar */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 text-center backdrop-blur-sm transition-transform duration-300 ${dirty ? "translate-y-0" : "translate-y-full"}`}>
            {error ? <p className="mb-1 text-xs font-medium text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={submitting}
              onClick={() => formRef.current?.requestSubmit()}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>,
          document.body,
        )}

      {typeof document !== "undefined" && toast
        ? createPortal(<Toast message={toast} onDismiss={() => setToast(null)} />, document.body)
        : null}
    </>
  );
}
