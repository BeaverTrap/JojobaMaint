"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WaterSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/water/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        synced?: number;
        error?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      const count = data.synced ?? 0;
      if (count === 0) {
        setMessage(
          "Synced 0 months — check the water sheet is shared with the service account.",
        );
        return;
      }
      setMessage(`Synced ${count} monthly report(s) from sheet.`);
      router.refresh();
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
        {loading ? "Syncing…" : "Sync monthly reports"}
      </button>
      {message && (
        <p className="max-w-[14rem] text-right text-xs text-muted">{message}</p>
      )}
    </div>
  );
}
