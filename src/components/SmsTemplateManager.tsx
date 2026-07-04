"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SmsTemplate } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { SMS_GSM_LIMIT, smsCharLimit } from "@/lib/sms-composer";
import {
  SMS_DASHBOARD_MESSAGE_TIER_OPTIONS,
  messageTierLabel,
  type SmsMessageTier,
} from "@/lib/sms-tiers";
import SmsSectionHeader from "@/components/SmsSectionHeader";

type FormState = {
  title: string;
  body: string;
  messageTier: SmsMessageTier;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  messageTier: "critical",
};

export default function SmsTemplateManager({
  templates: initialTemplates,
  onApply,
}: {
  templates: SmsTemplate[];
  onApply: (template: SmsTemplate) => void;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingId !== null;
  const charLimit = smsCharLimit(form.body);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function startEdit(template: SmsTemplate) {
    setEditingId(template.id);
    setForm({
      title: template.title,
      body: template.body,
      messageTier: template.message_tier,
    });
    setShowForm(true);
    setError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const body = form.body.trim();

    if (!title) {
      setError("Add a template name.");
      return;
    }
    if (!body) {
      setError("Add message text.");
      return;
    }
    if (body.length > charLimit) {
      setError(`Message must be ${charLimit} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload = {
        title,
        body,
        message_tier: form.messageTier,
      };

      if (isEditing) {
        const { data, error: updateError } = await supabase
          .from("sms_templates")
          .update(payload)
          .eq("id", editingId)
          .select(
            "id, title, body, message_tier, sort_order, created_at, updated_at",
          )
          .single();

        if (updateError) throw updateError;
        setTemplates((current) =>
          current.map((row) =>
            row.id === editingId ? (data as SmsTemplate) : row,
          ),
        );
      } else {
        const maxSort = templates.reduce(
          (max, row) => Math.max(max, row.sort_order),
          0,
        );
        const { data, error: insertError } = await supabase
          .from("sms_templates")
          .insert({ ...payload, sort_order: maxSort + 1 })
          .select(
            "id, title, body, message_tier, sort_order, created_at, updated_at",
          )
          .single();

        if (insertError) throw insertError;
        setTemplates((current) => [...current, data as SmsTemplate]);
      }

      cancelForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(template: SmsTemplate) {
    if (
      !window.confirm(
        `Delete template "${template.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("sms_templates")
        .delete()
        .eq("id", template.id);

      if (deleteError) throw deleteError;

      setTemplates((current) => current.filter((row) => row.id !== template.id));
      if (editingId === template.id) cancelForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SmsSectionHeader title="Saved templates">
          <p>
            Reusable messages for common situations. Tap{" "}
            <strong className="text-ink">Use</strong> to load one into the
            composer — you can edit before sending. Each template stores its own
            default message type.
          </p>
        </SmsSectionHeader>
        <button
          type="button"
          onClick={startCreate}
          disabled={submitting}
          className="rounded-lg border border-line bg-hover/40 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-hover disabled:opacity-50"
        >
          + New template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No templates yet. Add your first one, or run the SMS dashboard
          migration to load the starter set.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="rounded-xl border border-line bg-hover/20 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {template.title}
                  </p>
                  <p className="text-xs text-muted">
                    {messageTierLabel(template.message_tier)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink">
                    {template.body}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onApply(template)}
                    className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(template)}
                    disabled={submitting}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-hover disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template)}
                    disabled={submitting}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={handleSave}
          className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-900/50 dark:bg-brand-950/20"
        >
          <h3 className="text-sm font-semibold text-ink">
            {isEditing ? "Edit template" : "New template"}
          </h3>

          <label className="block text-sm">
            <span className="font-medium text-ink">Name</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Water shutoff"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink">Message type</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SMS_DASHBOARD_MESSAGE_TIER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                    form.messageTier === option.value
                      ? "border-brand-400 bg-surface"
                      : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="templateMessageTier"
                    checked={form.messageTier === option.value}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        messageTier: option.value,
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-ink">Message</span>
            <textarea
              rows={4}
              spellCheck
              value={form.body}
              onChange={(event) =>
                setForm((current) => ({ ...current, body: event.target.value }))
              }
              placeholder="Jojoba Hills: water shutoff in effect until further notice…"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>

          <p className="text-xs text-muted">
            {form.body.length} / {charLimit} characters
            {charLimit === SMS_GSM_LIMIT ? ` (max ${SMS_GSM_LIMIT})` : ""}
          </p>

          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add template"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={submitting}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-hover disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {!showForm && error ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}
    </section>
  );
}
