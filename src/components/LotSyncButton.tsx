"use client";

import { useState } from "react";

export default function LotSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/lots/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        synced?: number;
        error?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      setMessage(
        `Synced ${data.synced ?? 0} lot(s). Refresh to see updates.`,
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
        {loading ? "Syncing…" : "Sync lots from sheet"}
      </button>
      {message && (
        <p className="max-w-[14rem] text-right text-xs text-muted">{message}</p>
      )}
    </div>
  );
}
