"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MapSyncButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sheets/sync?type=valves", {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        synced?: number;
        valveCount?: number;
        lotsMissingMapPosition?: number;
        error?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      const parts = [
        `${data.synced ?? 0} lot(s)`,
        `${data.valveCount ?? 0} valve(s)`,
      ];
      let text = `Synced ${parts.join(" and ")} from sheet.`;
      if ((data.lotsMissingMapPosition ?? 0) > 0) {
        text += ` ${data.lotsMissingMapPosition} lot(s) need map coordinates.`;
      }
      setMessage(text);
      router.refresh();
    } catch {
      setMessage("Sync failed — check server logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={
        compact
          ? "inline-flex flex-col items-start gap-1"
          : "flex shrink-0 flex-col items-end gap-1"
      }
    >
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className={
          compact
            ? "rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            : "rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        }
      >
        {loading ? "Syncing…" : compact ? "Sync sheet" : "Sync Valve Inventory"}
      </button>
      {message && (
        <p
          className={
            compact
              ? "max-w-[14rem] text-xs text-muted"
              : "max-w-[16rem] text-right text-xs text-muted"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
