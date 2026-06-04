"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";

type Item = {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
};

export default function MultiImageUploader({
  galleryId,
}: {
  galleryId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setItems((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function uploadAll() {
    if (items.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      for (const item of items) {
        if (item.status === "done") continue;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "uploading" } : i,
          ),
        );
        try {
          const url = await uploadImage(
            supabase,
            item.file,
            `gallery/${galleryId}`,
          );
          const { error: insertError } = await supabase
            .from("gallery_images")
            .insert({ gallery_id: galleryId, image_url: url });
          if (insertError) throw insertError;

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "done" } : i,
            ),
          );
        } catch {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "error" } : i,
            ),
          );
        }
      }

      // Clear successfully uploaded items and refresh the grid.
      setItems((prev) => prev.filter((i) => i.status === "error"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const pendingCount = items.filter((i) => i.status !== "done").length;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive
            ? "border-brand-400 bg-brand-50 dark:bg-brand-900/30"
            : "border-line bg-canvas"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-3xl">⬆️</p>
        <p className="mt-2 text-sm font-medium text-ink">
          {isDragActive
            ? "Drop the photos here…"
            : "Drag & drop photos here"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Images are compressed to under ~300 KB before upload.
        </p>
        <button
          type="button"
          onClick={open}
          className="mt-4 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Browse / take photos
        </button>
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt="To upload"
                  className="h-full w-full object-cover"
                />
                {item.status !== "pending" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
                    {item.status === "uploading" && "Uploading…"}
                    {item.status === "done" && "✓"}
                    {item.status === "error" && "Failed"}
                  </div>
                )}
                {item.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={uploadAll}
            disabled={uploading || pendingCount === 0}
            className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading
              ? "Uploading…"
              : `Upload ${pendingCount} photo${pendingCount === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}
