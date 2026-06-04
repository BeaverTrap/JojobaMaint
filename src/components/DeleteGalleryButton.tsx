"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteImageByUrl } from "@/lib/upload";

// Any authorized staff member can delete any gallery (no author check).
export default function DeleteGalleryButton({
  galleryId,
  imageUrls,
}: {
  galleryId: string;
  imageUrls: string[];
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
      // Deleting the gallery cascades to its gallery_images rows.
      const { error: delError } = await supabase
        .from("galleries")
        .delete()
        .eq("id", galleryId);
      if (delError) throw delError;

      for (const url of imageUrls) await deleteImageByUrl(supabase, url);

      router.push("/admin/galleries");
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
        Delete gallery
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        Delete this gallery and all its photos? This can&apos;t be undone.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted transition hover:bg-hover hover:text-ink"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
