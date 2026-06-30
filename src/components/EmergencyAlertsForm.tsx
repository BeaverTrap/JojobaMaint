"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const SMS_MAX_LENGTH = 160;

type Toast = {
  tone: "success" | "error";
  text: string;
};

export default function EmergencyAlertsForm({
  availableTags,
}: {
  availableTags: string[];
}) {
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const charCount = message.length;
  const overLimit = charCount > SMS_MAX_LENGTH;

  const canSend = useMemo(() => {
    if (!message.trim() || overLimit || submitting) return false;
    return sendToAll || selectedTags.size > 0;
  }, [message, overLimit, submitting, sendToAll, selectedTags.size]);

  function toggleTag(tag: string) {
    setSelectedTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;

    const confirmed = window.confirm(
      sendToAll
        ? `Send this alert to ALL residents?\n\n"${message.trim()}"`
        : `Send to groups: ${[...selectedTags].join(", ")}?\n\n"${message.trim()}"`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    setToast(null);

    try {
      const response = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          tags: [...selectedTags],
          sendToAll,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sent?: number;
        attempted?: number;
        failed?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send alert");
      }

      const sent = data.sent ?? 0;
      const failed = data.failed ?? 0;
      setToast({
        tone: "success",
        text:
          failed > 0
            ? `Sent ${sent} of ${data.attempted ?? sent} messages (${failed} failed).`
            : `Mass alert sent to ${sent} recipient${sent === 1 ? "" : "s"}.`,
      });
      setMessage("");
    } catch (err) {
      setToast({
        tone: "error",
        text:
          err instanceof Error ? err.message : "Could not send mass alert.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <legend className="px-1 text-sm font-semibold text-ink">
          Recipients
        </legend>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-hover/40 px-3 py-2.5">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(event) => {
              setSendToAll(event.target.checked);
              if (event.target.checked) setSelectedTags(new Set());
            }}
            className="h-4 w-4 rounded border-line"
          />
          <span className="text-sm font-medium text-ink">Send to All</span>
        </label>

        {!sendToAll ? (
          availableTags.length === 0 ? (
            <p className="text-sm text-muted">
              No resident tags in the database yet. Add rows to the{" "}
              <code className="text-xs">residents</code> table, or use Send to
              All.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {availableTags.map((tag) => {
                const checked = selectedTags.has(tag);
                return (
                  <label
                    key={tag}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      checked
                        ? "border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/30"
                        : "border-line bg-surface hover:bg-hover/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTag(tag)}
                      className="h-4 w-4 rounded border-line"
                    />
                    <span className="text-sm font-medium text-ink">{tag}</span>
                  </label>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-sm text-muted">
            Every resident with a valid phone number will receive this message.
          </p>
        )}
      </fieldset>

      <div className="space-y-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <label className="block text-sm font-semibold text-ink" htmlFor="sms-body">
          Message
        </label>
        <textarea
          id="sms-body"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Emergency alert message…"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Single-segment SMS (GSM-7)</span>
          <span
            className={
              overLimit
                ? "font-semibold text-red-600 dark:text-red-400"
                : charCount > 140
                  ? "font-medium text-amber-700 dark:text-amber-300"
                  : "text-muted"
            }
          >
            {charCount} / {SMS_MAX_LENGTH}
          </span>
        </div>
      </div>

      {toast ? (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {toast.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send Mass Alert"}
        </button>
        <Link
          href="/admin"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
    </form>
  );
}
