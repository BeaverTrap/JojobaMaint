"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { formatBytes } from "@/lib/compress";

export default function QuickUploader({
  redirectTo,
}: {
  /** Where to send the user after a successful post (defaults to refresh-in-place). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickFile(selected: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } else {
      setFile(null);
      setPreview(null);
    }
  }

  function reset() {
    setDescription("");
    pickFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please add a short description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to post.");

      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await uploadImage(supabase, file, "posts");
      }

      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        description: description.trim(),
        image_url: imageUrl,
      });
      if (insertError) throw insertError;

      reset();
      if (redirectTo) {
        setDone(true);
        router.push(redirectTo);
      }
      router.refresh(); // re-fetch the server-rendered feed
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you work on? (e.g. Replaced irrigation valve at site 142)"
        rows={2}
        className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />

      {preview && (
        <div className="relative mt-3 inline-block">
          <Image
            src={preview}
            alt="Selected preview"
            width={120}
            height={120}
            unoptimized
            className="h-28 w-28 rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => pickFile(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
            aria-label="Remove image"
          >
            ×
          </button>
          <p className="mt-1 text-xs text-muted">
            {file ? formatBytes(file.size) : ""} · compressed on upload
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {done && !error && (
        <p className="mt-2 text-sm text-brand-700">Posted! Opening the feed…</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-hover">
          <CameraIcon />
          {file ? "Change photo" : "Add photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 7a2 2 0 0 1 2-2h1l1-1.5h6L15 5h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
