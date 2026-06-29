"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/announcements";
import { POWER_STATUS_ID } from "@/lib/power-status";
import type { PowerStatus, PowerStatusLevel } from "@/lib/database.types";

const STATUS_OPTIONS: { value: PowerStatusLevel; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "planned", label: "Planned outage" },
  { value: "outage", label: "Known outage" },
];

export default function PowerStatusForm({
  initial,
}: {
  initial: PowerStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PowerStatusLevel>(initial.status);
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
        .from("power_status")
        .update({
          status,
          note: note.trim() || null,
          expected_restore_at: restoreAt.trim()
            ? fromDatetimeLocalValue(restoreAt)
            : null,
          updated_by: user.id,
        })
        .eq("id", POWER_STATUS_ID);
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
          Power status saved.
        </p>
      ) : null}

      <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
        The home page already shows live SCE outages near the park from Cal OES.
        Use this only to post a manual override — e.g. a confirmed park outage
        the feed hasn&apos;t picked up yet, or a planned shutoff.
      </p>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as PowerStatusLevel)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Note (optional)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="e.g. Outage affecting Loop B, SCE crews on site."
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
          {submitting ? "Saving…" : "Save power status"}
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
