"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PICKUP_GUIDELINES_ID } from "@/lib/pickup-guidelines";
import PickupScheduleToggle from "@/components/PickupScheduleToggle";
import {
  pickupScheduleFromFlag,
  type PickupScheduleMode,
} from "@/lib/pickup-schedule";

export default function PickupGuidelinesForm({
  initialTitle,
  initialBody,
  initialSummerSchedule,
}: {
  initialTitle: string;
  initialBody: string;
  initialSummerSchedule: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [scheduleMode, setScheduleMode] = useState<PickupScheduleMode>(
    pickupScheduleFromFlag(initialSummerSchedule),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    if (!body.trim()) {
      setError("Add the guidelines body.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: upd } = await supabase
        .from("pickup_guidelines")
        .update({
          title: title.trim(),
          body: body.trim(),
          is_summer_schedule: scheduleMode === "summer",
        })
        .eq("id", PICKUP_GUIDELINES_ID);

      if (upd) throw upd;
      router.push("/pickup-guidelines");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PickupScheduleToggle
        initialMode={pickupScheduleFromFlag(initialSummerSchedule)}
        onModeChange={setScheduleMode}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Page title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Guidelines (Markdown)</span>
          <p className="text-xs text-muted">
            Use ## headings, **bold**, and blank lines between sections.
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={24}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-sm leading-relaxed text-ink"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save guidelines"}
          </button>
          <Link
            href="/pickup-guidelines"
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
