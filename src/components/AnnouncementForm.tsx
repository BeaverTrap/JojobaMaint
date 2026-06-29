"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/announcements";
import {
  PARK_ALERT_TYPE_OPTIONS,
  suggestedSeverityForAlertType,
} from "@/lib/park-alerts";
import type { AnnouncementSeverity, ParkAlertType } from "@/lib/database.types";

const SEVERITY_OPTIONS: { value: AnnouncementSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "notice", label: "Notice" },
  { value: "urgent", label: "Urgent" },
];

type Props = {
  redirectTo: string;
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      announcementId: string;
      initialTitle: string;
      initialBody: string;
      initialSeverity: AnnouncementSeverity;
      initialAlertType: ParkAlertType;
      initialStartsAt: string;
      initialEndsAt: string | null;
      initialPublished: boolean;
      initialPosition: number;
    }
);

export default function AnnouncementForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [body, setBody] = useState(isEdit ? props.initialBody : "");
  const [alertType, setAlertType] = useState<ParkAlertType>(
    isEdit ? props.initialAlertType : "general",
  );
  const [severity, setSeverity] = useState<AnnouncementSeverity>(
    isEdit ? props.initialSeverity : "info",
  );
  const [startsAt, setStartsAt] = useState(
    isEdit
      ? toDatetimeLocalValue(props.initialStartsAt)
      : toDatetimeLocalValue(new Date().toISOString()),
  );
  const [endsAt, setEndsAt] = useState(
    isEdit && props.initialEndsAt
      ? toDatetimeLocalValue(props.initialEndsAt)
      : "",
  );
  const [published, setPublished] = useState(
    isEdit ? props.initialPublished : false,
  );
  const [position, setPosition] = useState(isEdit ? props.initialPosition : 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = PARK_ALERT_TYPE_OPTIONS.find(
    (option) => option.value === alertType,
  );

  function handleAlertTypeChange(next: ParkAlertType) {
    setAlertType(next);
    setSeverity(suggestedSeverityForAlertType(next));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    if (!body.trim()) {
      setError("Add a message body.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const payload = {
        title: title.trim(),
        body: body.trim(),
        severity,
        alert_type: alertType,
        starts_at: fromDatetimeLocalValue(startsAt),
        ends_at: endsAt.trim() ? fromDatetimeLocalValue(endsAt) : null,
        published,
        position,
      };

      if (isEdit) {
        const { error: updateError } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", props.announcementId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("announcements")
          .insert({ ...payload, author_id: user.id });
        if (insertError) throw insertError;
      }

      router.push(props.redirectTo);
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

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Alert type</span>
        <select
          value={alertType}
          onChange={(event) =>
            handleAlertTypeChange(event.target.value as ParkAlertType)
          }
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        >
          {PARK_ALERT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selectedType ? (
          <span className="text-xs text-muted">{selectedType.hint}</span>
        ) : null}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Message</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Severity</span>
          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value as AnnouncementSeverity)
            }
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Display order</span>
          <input
            type="number"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value) || 0)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Starts</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Ends</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="h-4 w-4 rounded border-line"
        />
        <span className="text-sm font-medium text-ink">Published</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create alert"}
        </button>
        <Link
          href={props.redirectTo}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
