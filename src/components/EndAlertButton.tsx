"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EndAlertButton({
  announcementId,
  redirectTo,
}: {
  announcementId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function endNow() {
    setEnding(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ ends_at: new Date().toISOString() })
        .eq("id", announcementId);
      if (updateError) throw updateError;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end alert");
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={endNow}
        disabled={ending}
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
      >
        {ending ? "Ending…" : "End alert now"}
      </button>
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
