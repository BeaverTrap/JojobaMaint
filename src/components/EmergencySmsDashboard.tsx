"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import PageMascotHeading from "@/components/PageMascotHeading";
import type { SmsHistoryRow } from "@/lib/sms-history";
import type { SmsTemplate } from "@/lib/database.types";
import type { MascotSceneId } from "@/lib/mascot-scenes";
import {
  SMS_DASHBOARD_MESSAGE_TIER_OPTIONS,
  messageTierLabel,
  type SmsMessageTier,
} from "@/lib/sms-tiers";
import { isWebmasterRole, type StaffRole } from "@/lib/staff-roles";
import SmsTemplateManager from "@/components/SmsTemplateManager";
import SmsDashboardHelp from "@/components/SmsDashboardHelp";
import SmsSectionHeader from "@/components/SmsSectionHeader";
import GeminiIcon from "@/components/GeminiIcon";
import {
  containsEmoji,
  SMS_GSM_LIMIT,
  SMS_UCS2_LIMIT,
  smsCharLimit,
} from "@/lib/sms-composer";

type Toast = { tone: "success" | "error"; text: string };

type ConfirmState = {
  recipientCount: number;
  skippedByTier: number;
};

function smsHeadingScene(tier: SmsMessageTier): MascotSceneId {
  switch (tier) {
    case "critical":
      return "alertSms";
    case "standard":
    case "announcement":
      return "alertCommunitySms";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export default function EmergencySmsDashboard({
  templates,
  history,
  viewerRole,
}: {
  templates: SmsTemplate[];
  history: SmsHistoryRow[];
  viewerRole: StaffRole;
}) {
  const canConfigureGemini = isWebmasterRole(viewerRole);

  const [messageTier, setMessageTier] = useState<SmsMessageTier>("critical");
  const [message, setMessage] = useState("");
  const [emojiWarning, setEmojiWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const charLimit = smsCharLimit(message);
  const charCount = message.length;
  const overLimit = charCount > charLimit;

  const canProceed = useMemo(() => {
    return Boolean(message.trim()) && !overLimit && !submitting;
  }, [message, overLimit, submitting]);

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

  async function loadPreview(): Promise<ConfirmState | null> {
    try {
      const response = await fetch("/api/sms/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          tags: [],
          sendToAll: true,
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

  async function handleSendClick() {
    if (!canProceed) return;
    const preview = await loadPreview();
    if (!preview) return;
    if (preview.recipientCount === 0) {
      setToast({
        tone: "error",
        text: "No recipients match your selection and message type filter.",
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
        setToast({
          tone: "success",
          text: "Gemini rewrote your message — review before sending.",
        });
      }
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Gemini rewrite failed",
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
      tags: [],
      sendToAll: true,
      messageTier,
    };

    try {
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
        <PageMascotHeading
          scene={smsHeadingScene(messageTier)}
          title="Emergency SMS Dashboard"
          description="Mass-text park alerts — templates, audience tags, message types, scheduling, and delivery log."
        />

        <SmsDashboardHelp viewerRole={viewerRole} />

        <SmsTemplateManager templates={templates} onApply={applyTemplate} />

        <section className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <SmsSectionHeader title="Who to text">
            <p>
              Alerts go to <strong className="text-ink">every resident</strong>{" "}
              with a valid phone number in the list. Choose the{" "}
              <strong className="text-ink">message type</strong> below — residents
              who opted out of that level are skipped automatically.
            </p>
          </SmsSectionHeader>

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink">Message type</p>
            <p className="text-xs text-muted">
              Residents choose how much they want to hear from us (
              <strong>emergency-only</strong> or <strong>standard</strong>).
              Pick the type that matches this message.
            </p>
            <div className="grid gap-2">
              {SMS_DASHBOARD_MESSAGE_TIER_OPTIONS.map((option) => (
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
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <SmsSectionHeader title="Composer">
            <p>
              Write the text that goes to every resident. One message, one send
              — keep it under the character counter.{" "}
              <strong className="text-ink">Google Gemini</strong> rewrites
              your draft into clear, professional alert wording. Always review
              the result before sending.
            </p>
          </SmsSectionHeader>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePolish}
              disabled={!message.trim() || polishing}
              className="inline-flex items-center gap-2 rounded-lg border border-[#4285F4]/40 bg-gradient-to-r from-[#4285F4]/10 via-[#9B72CB]/10 to-[#D96570]/10 px-3 py-1.5 text-xs font-semibold text-ink hover:from-[#4285F4]/20 hover:via-[#9B72CB]/20 hover:to-[#D96570]/20 disabled:opacity-50 dark:border-[#9B72CB]/50"
            >
              <GeminiIcon className="h-4 w-4 shrink-0" />
              {polishing ? "Google Gemini…" : "Google Gemini"}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Optional rewrite — not required to send. Google may require billing
            or prepaid credits on your API key (
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              AI Studio
            </a>
            ).{" "}
            {canConfigureGemini ? (
              <>
                Set{" "}
                <code className="rounded bg-hover px-1 py-0.5 text-ink">
                  GEMINI_API_KEY
                </code>{" "}
                on the server.
              </>
            ) : (
              <>Contact your webmaster if rewrite is unavailable.</>
            )}
          </p>

          <textarea
            spellCheck
            rows={5}
            value={message}
            onChange={(event) => handleMessageChange(event.target.value)}
            placeholder="Write your alert message…"
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

        <div className="space-y-2">
          <SmsSectionHeader title="Send">
            <p>
              You will see a confirmation with the exact recipient count before
              anything goes out.
            </p>
          </SmsSectionHeader>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canProceed}
              onClick={handleSendClick}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Send Mass Alert
            </button>
          <Link
            href="/admin"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <SmsSectionHeader title="Audit log">
              <p>
                History of every mass text: who sent it, audience, delivery
                counts (including voice fallback for landlines), and the message
                text. Newest first.
              </p>
            </SmsSectionHeader>
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
              Confirm send
            </h2>
            <p className="mt-2 text-sm text-muted">
              You are about to send this alert to{" "}
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
                  : "Confirm send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
