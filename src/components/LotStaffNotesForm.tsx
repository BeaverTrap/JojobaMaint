"use client";

import { useState } from "react";

export default function LotStaffNotesForm({
  slug,
  initialNotes,
}: {
  slug: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/lots/${slug}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_notes: notes }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Save failed");
        return;
      }
      setMessage("Saved.");
    } catch {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-4">
      <h2 className="text-lg font-bold text-ink">Staff notes</h2>
      <p className="mt-1 text-sm text-muted">
        Internal notes for maintenance — not synced from the spreadsheet.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="mt-3 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink"
        placeholder="Cross-connection history, meter access, special instructions…"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {message && <p className="text-sm text-muted">{message}</p>}
      </div>
    </section>
  );
}
