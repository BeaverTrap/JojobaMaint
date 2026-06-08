"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PICKUP_GUIDELINES_ID } from "@/lib/pickup-guidelines";
import {
  pickupBannerPreview,
  type PickupScheduleMode,
} from "@/lib/pickup-schedule";

/** Prominent summer / regular toggle for the feed banner. */
export default function PickupScheduleToggle({
  initialMode,
  onModeChange,
}: {
  initialMode: PickupScheduleMode;
  onModeChange?: (mode: PickupScheduleMode) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const dirty = mode !== initialMode;

  function select(next: PickupScheduleMode) {
    setMode(next);
    onModeChange?.(next);
    setMessage(null);
    setError(null);
  }

  async function saveSchedule() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: upd } = await supabase
        .from("pickup_guidelines")
        .update({ is_summer_schedule: mode === "summer" })
        .eq("id", PICKUP_GUIDELINES_ID);

      if (upd) throw upd;
      setMessage("Banner schedule updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save schedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4 dark:border-brand-800/60 dark:bg-brand-950/40 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-800 dark:text-brand-200">
            Feed banner schedule
          </h2>
          <p className="mt-1 text-sm text-muted">
            Switches the pickup notice on the home feed. Guidelines text below
            is separate — update that when you edit the page content.
          </p>
        </div>
        <span
          className={
            mode === "summer"
              ? "rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
              : "rounded-full bg-surface px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-300 dark:text-brand-200 dark:ring-brand-700"
          }
        >
          {mode === "summer" ? "Summer active" : "Regular active"}
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
        role="group"
        aria-label="Pickup schedule"
      >
        <ScheduleOption
          selected={mode === "summer"}
          title="Summer schedule"
          detail="Mondays only — slow season when many residents are away."
          onSelect={() => select("summer")}
        />
        <ScheduleOption
          selected={mode === "regular"}
          title="Regular schedule"
          detail="Mondays and Thursdays — full park, twice weekly."
          onSelect={() => select("regular")}
        />
      </div>

      <p className="mt-3 rounded-lg bg-surface/80 px-3 py-2 text-sm text-ink ring-1 ring-line dark:bg-black/40">
        <span className="font-medium">Banner preview: </span>
        {pickupBannerPreview(mode)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveSchedule}
          disabled={saving || !dirty}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save schedule"}
        </button>
        {dirty && !saving && (
          <span className="text-xs text-muted">Unsaved change</span>
        )}
        {message && (
          <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
            {message}
          </span>
        )}
        {error && (
          <span className="text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </span>
        )}
      </div>
    </section>
  );
}

function ScheduleOption({
  selected,
  title,
  detail,
  onSelect,
}: {
  selected: boolean;
  title: string;
  detail: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={
        selected
          ? "rounded-xl border-2 border-brand-600 bg-surface px-4 py-3 text-left shadow-sm ring-2 ring-brand-600/20"
          : "rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-brand-300 hover:bg-hover"
      }
    >
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-xs leading-snug text-muted">{detail}</span>
    </button>
  );
}
