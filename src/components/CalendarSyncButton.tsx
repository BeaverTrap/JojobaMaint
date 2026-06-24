"use client";

import { useState } from "react";

export default function CalendarSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        synced?: number;
        removed?: number;
        mode?: string;
        error?: string;
        missing?: string[];
        hints?: string[];
      };
      if (!res.ok) {
        if (data.missing?.length && data.hints?.length) {
          setMessage(
            `${data.error ?? "Not configured"}: ${data.hints.join(" ")}`,
          );
          return;
        }
        setMessage(data.error ?? "Sync failed");
        return;
      }
      const removed = data.removed ?? 0;
      const removedNote =
        removed > 0 ? ` Removed ${removed} deleted event(s).` : "";
      setMessage(
        `Synced ${data.synced ?? 0} event(s) (${data.mode ?? "full"}).${removedNote} Refresh to see updates.`,
      );
    } catch {
      setMessage("Sync failed — check server logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Syncing…" : "Sync calendar"}
      </button>
      {message && (
        <p className="max-w-xs text-right text-xs leading-snug text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
