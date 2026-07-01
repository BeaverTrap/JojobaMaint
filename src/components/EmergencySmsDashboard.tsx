"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { SmsHistoryRow } from "@/lib/sms-history";
import type { SmsTemplate } from "@/lib/database.types";
import {
  MESSAGE_TIER_OPTIONS,
  messageTierLabel,
  type SmsMessageTier,
} from "@/lib/sms-tiers";
import {
  containsEmoji,
  SMS_GSM_LIMIT,
  SMS_UCS2_LIMIT,
  smsCharLimit,
} from "@/lib/sms-composer";

type Toast = { tone: "success" | "error"; text: string };

type ConfirmState = {
  mode: "send" | "schedule";
  recipientCount: number;
  skippedByTier: number;
};

export default function EmergencySmsDashboard({
  templates,
  availableTags,
  history,
}: {
  templates: SmsTemplate[];
  availableTags: string[];
  history: SmsHistoryRow[];
}) {
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [messageTier, setMessageTier] = useState<SmsMessageTier>("critical");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [emojiWarning, setEmojiWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const charLimit = smsCharLimit(message);
  const charCount = message.length;
  const overLimit = charCount > charLimit;
  const scheduleMode = scheduledAt.trim().length > 0;

  const audienceReady = sendToAll || selectedTags.size > 0;

  const canProceed = useMemo(() => {
    if (!message.trim() || overLimit || submitting || !audienceReady) {
      return false;
    }
    if (scheduleMode) {
      const when = new Date(scheduledAt);
      return !Number.isNaN(when.getTime()) && when.getTime() > Date.now();
    }
    return true;
  }, [
    message,
    overLimit,
    submitting,
    audienceReady,
    scheduleMode,
    scheduledAt,
  ]);

  function toggleTag(tag: string) {
    setSelectedTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function applyTemplate(template: SmsTemplate) {
    setMessage(template.body);
    setMessageTier(template.message_tier);
    setEmojiWarning(containsEmoji(template.body));
  }

  function handleMessageChange(value: string) {
    setMessage(value);
    const hasEmoji = containsEmoji(value);
    setEmojiWarning(hasEmoji);
  }

  async function loadPreview(mode: "send" | "schedule"): Promise<ConfirmState | null> {
    try {
      const response = await fetch("/api/sms/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          tags: [...selectedTags],
          sendToAll,
          messageTier,
        }),
      });
      const data = (await response.json()) as {
        recipientCount?: number;
        skippedByTier?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Could not preview audience");
      return {
        mode,
        recipientCount: data.recipientCount ?? 0,
        skippedByTier: data.skippedByTier ?? 0,
      };
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not preview recipients",
      });
      return null;
    }
  }

  async function handlePrimaryClick(mode: "send" | "schedule") {
    if (!canProceed) return;
    const preview = await loadPreview(mode);
    if (!preview) return;
    if (preview.recipientCount === 0) {
      setToast({
        tone: "error",
        text: "No recipients match your selection and alert tier filter.",
      });
      return;
    }
    setConfirm(preview);
  }

  async function handlePolish() {
    if (!message.trim() || polishing) return;
    setPolishing(true);
    setToast(null);
    try {
      const response = await fetch("/api/sms/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: message.trim() }),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Polish failed");
      if (data.message) {
        handleMessageChange(data.message);
        setToast({ tone: "success", text: "Message polished with AI." });
      }
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not polish message",
      });
    } finally {
      setPolishing(false);
    }
  }

  async function executeConfirmed() {
    if (!confirm) return;
    setSubmitting(true);
    setToast(null);

    const payload = {
      message: message.trim(),
      tags: [...selectedTags],
      sendToAll,
      messageTier,
    };

    try {
      if (confirm.mode === "schedule") {
        const response = await fetch("/api/sms/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            scheduledAt: new Date(scheduledAt).toISOString(),
            syncToCalendar,
          }),
        });
        const data = (await response.json()) as { error?: string; id?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not schedule alert");
        setToast({
          tone: "success",
          text: syncToCalendar
            ? "Alert scheduled and synced to Google Calendar."
            : "Alert scheduled successfully.",
        });
        setScheduledAt("");
        setSyncToCalendar(false);
      } else {
        const response = await fetch("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as {
          error?: string;
          successCount?: number;
          failedCount?: number;
          voiceFallbackCount?: number;
        };
        if (!response.ok) throw new Error(data.error ?? "Send failed");
        const voice = data.voiceFallbackCount ?? 0;
        setToast({
          tone: "success",
          text:
            voice > 0
              ? `Sent ${data.successCount ?? 0} alerts (${voice} via voice fallback).`
              : `Mass alert sent to ${data.successCount ?? 0} recipient${data.successCount === 1 ? "" : "s"}.`,
        });
        setMessage("");
      }
      setConfirm(null);
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Operation failed",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {templates.length > 0 ? (
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Templates</h2>
            <p className="mt-1 text-xs text-muted">
              Quick-fill the composer. Supports {"{Name}"} and {"{Lot}"} per
              recipient.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-full border border-line bg-hover/40 px-3 py-1.5 text-sm font-medium text-ink hover:bg-hover"
                >
                  {template.title}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <legend className="px-1 text-sm font-semibold text-ink">
            Audience
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

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink">Message type</p>
            <p className="text-xs text-muted">
              Residents choose how much they want to hear from us (
              <strong>emergency-only</strong>, <strong>standard</strong>, or{" "}
              <strong>frequent updates</strong>). Pick the type that matches
              this message.
            </p>
            <div className="grid gap-2">
              {MESSAGE_TIER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                    messageTier === option.value
                      ? "border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/30"
                      : "border-line hover:bg-hover/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="messageTier"
                    checked={messageTier === option.value}
                    onChange={() => setMessageTier(option.value)}
                    className="mt-0.5 h-4 w-4 border-line"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {!sendToAll ? (
            availableTags.length === 0 ? (
              <p className="text-sm text-muted">
                No tags in the residents table yet — use Send to All or add
                residents with tags.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableTags.map((tag) => {
                  const checked = selectedTags.has(tag);
                  return (
                    <label
                      key={tag}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                        checked
                          ? "border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/30"
                          : "border-line hover:bg-hover/50"
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
              All residents with valid numbers — message type still filters by
              each person&apos;s contact preference.
            </p>
          )}
        </fieldset>

        <section className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Composer</h2>
            <button
              type="button"
              onClick={handlePolish}
              disabled={!message.trim() || polishing}
              className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
            >
              {polishing ? "Polishing…" : "✨ Magic Polish"}
            </button>
          </div>

          <textarea
            spellCheck
            rows={5}
            value={message}
            onChange={(event) => handleMessageChange(event.target.value)}
            placeholder="Emergency alert… use {Name} and {Lot} for personalization"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
          />

          {emojiWarning ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Emoji detected — SMS limit drops to {SMS_UCS2_LIMIT} characters
              (UCS-2 segment).
            </p>
          ) : null}

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {emojiWarning ? "UCS-2 (emoji)" : "GSM-7"} segment
            </span>
            <span
              className={
                overLimit
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : charCount > charLimit - 20
                    ? "font-medium text-amber-700 dark:text-amber-300"
                    : "text-muted"
              }
            >
              {charCount} / {charLimit}
              {!emojiWarning && charLimit === SMS_GSM_LIMIT ? (
                <span className="text-muted"> (max {SMS_GSM_LIMIT})</span>
              ) : null}
            </span>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">
            Schedule (optional)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-ink">Send at</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-ink"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-line px-3 py-2.5">
              <input
                type="checkbox"
                checked={syncToCalendar}
                onChange={(event) => setSyncToCalendar(event.target.checked)}
                disabled={!scheduleMode}
                className="h-4 w-4 rounded border-line disabled:opacity-40"
              />
              <span className="text-sm font-medium text-ink">
                Sync to Google Calendar
              </span>
            </label>
          </div>
          <p className="text-xs text-muted">
            Leave blank to send immediately. Scheduled alerts dispatch via Vercel
            Cron every minute.
          </p>
        </section>

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
          {scheduleMode ? (
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => handlePrimaryClick("schedule")}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Schedule Alert
            </button>
          ) : (
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => handlePrimaryClick("send")}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Send Mass Alert
            </button>
          )}
          <Link
            href="/admin"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Audit log</h2>
            <p className="text-xs text-muted">
              Recent sends from sms_history (newest first).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-hover/30 text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-semibold">When</th>
                  <th className="px-4 py-2 font-semibold">Sent by</th>
                  <th className="px-4 py-2 font-semibold">Audience</th>
                  <th className="px-4 py-2 font-semibold">Results</th>
                  <th className="px-4 py-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted"
                    >
                      No messages sent yet.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-line/70 align-top last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        {format(new Date(row.created_at), "MMM d, h:mm a")}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.profiles?.display_name ?? "System"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.send_to_all
                          ? "All"
                          : (row.tags ?? []).join(", ") || "—"}
                        <br />
                        <span className="text-muted">
                          {messageTierLabel(row.message_tier)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.success_count}/{row.recipient_count} sent
                        {row.voice_fallback_count > 0
                          ? ` · ${row.voice_fallback_count} voice`
                          : ""}
                        {row.failed_count > 0
                          ? ` · ${row.failed_count} failed`
                          : ""}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-ink">
                        {row.body_template}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {confirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sms-confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h2
              id="sms-confirm-title"
              className="text-lg font-bold text-ink"
            >
              Confirm {confirm.mode === "schedule" ? "schedule" : "send"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              You are about to{" "}
              {confirm.mode === "schedule" ? "schedule" : "send"} this alert to{" "}
              <strong className="text-ink">
                {confirm.recipientCount} recipient
                {confirm.recipientCount === 1 ? "" : "s"}
              </strong>
              .
            </p>
            {confirm.skippedByTier > 0 ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {confirm.skippedByTier} resident
                {confirm.skippedByTier === 1 ? "" : "s"} skipped — their contact
                preference ({messageTierLabel(messageTier).toLowerCase()}) does
                not include this message type.
              </p>
            ) : null}
            <blockquote className="mt-4 rounded-xl border border-line bg-hover/30 px-3 py-2 text-sm text-ink">
              {message.trim()}
            </blockquote>
            {confirm.mode === "schedule" && scheduledAt ? (
              <p className="mt-2 text-xs text-muted">
                Scheduled for{" "}
                {format(new Date(scheduledAt), "EEE, MMM d · h:mm a")}
                {syncToCalendar ? " · Google Calendar sync on" : ""}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={submitting}
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmed}
                disabled={submitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting
                  ? "Working…"
                  : confirm.mode === "schedule"
                    ? "Confirm schedule"
                    : "Confirm send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
