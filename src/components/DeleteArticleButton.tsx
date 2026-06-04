"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteImageByUrl } from "@/lib/upload";

export default function DeleteArticleButton({
  articleId,
  coverImageUrl,
  redirectTo,
}: {
  articleId: string;
  coverImageUrl: string | null;
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
      const { error: delError } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);
      if (delError) throw delError;
      if (coverImageUrl) await deleteImageByUrl(supabase, coverImageUrl);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
      >
        Delete article
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        Delete this article permanently?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted hover:bg-hover"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
