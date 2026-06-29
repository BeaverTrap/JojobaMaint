"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAnnouncementButton({
  announcementId,
  redirectTo,
}: {
  announcementId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);
      if (deleteError) throw deleteError;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">Delete this announcement permanently?</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-medium text-red-700 hover:underline dark:text-red-300"
        >
          Delete announcement
        </button>
      )}
    </div>
  );
}
