"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/announcements";
import { WATER_SYSTEM_STATUS_ID } from "@/lib/water-status";
import type {
  WaterSupplyMode,
  WaterSystemStatus,
  WaterSystemStatusLevel,
} from "@/lib/database.types";

const SUPPLY_OPTIONS: { value: WaterSupplyMode; label: string }[] = [
  { value: "full_pressure", label: "Full pressure" },
  { value: "gravity", label: "Gravity feed" },
];

const STATUS_OPTIONS: { value: WaterSystemStatusLevel; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "planned_shutoff", label: "Planned shutoff" },
  { value: "active_shutoff", label: "Active shutoff" },
];

export default function WaterStatusForm({
  initial,
}: {
  initial: WaterSystemStatus;
}) {
  const router = useRouter();
  const [supplyMode, setSupplyMode] = useState<WaterSupplyMode>(
    initial.supply_mode,
  );
  const [status, setStatus] = useState<WaterSystemStatusLevel>(initial.status);
  const [affectedAreas, setAffectedAreas] = useState(
    initial.affected_areas ?? "",
  );
  const [note, setNote] = useState(initial.note ?? "");
  const [restoreAt, setRestoreAt] = useState(
    initial.expected_restore_at
      ? toDatetimeLocalValue(initial.expected_restore_at)
      : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

      const { error: updateError } = await supabase
        .from("water_system_status")
        .update({
          supply_mode: supplyMode,
          status,
          affected_areas: affectedAreas.trim() || null,
          note: note.trim() || null,
          expected_restore_at: restoreAt.trim()
            ? fromDatetimeLocalValue(restoreAt)
            : null,
          updated_by: user.id,
        })
        .eq("id", WATER_SYSTEM_STATUS_ID);
      if (updateError) throw updateError;

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          Water status saved.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Supply mode</span>
          <select
            value={supplyMode}
            onChange={(event) =>
              setSupplyMode(event.target.value as WaterSupplyMode)
            }
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          >
            {SUPPLY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Status</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as WaterSystemStatusLevel)
            }
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">
          Affected areas (optional)
        </span>
        <input
          type="text"
          value={affectedAreas}
          onChange={(event) => setAffectedAreas(event.target.value)}
          placeholder="e.g. Zones 8–10, Oak Grove loop"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Note (optional)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Extra detail for residents and crew."
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">
          Expected restore (optional)
        </span>
        <input
          type="datetime-local"
          value={restoreAt}
          onChange={(event) => setRestoreAt(event.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save water status"}
        </button>
        <Link
          href="/"
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-hover"
        >
          View home
        </Link>
      </div>
    </form>
  );
}
