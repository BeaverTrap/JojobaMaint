"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, deleteImageByUrl } from "@/lib/upload";
import type { PostCategory } from "@/lib/database.types";

type ExistingImage = {
  // "legacy" marks the post's original single image_url column.
  key: string;
  url: string;
  isLegacy: boolean;
};

type RecentPost = {
  id: string;
  description: string;
};

type NewImage = {
  id: string;
  file: File;
  preview: string;
};

export default function PostForm({
  mode,
  postId,
  initialDescription = "",
  initialCategory = "maintenance",
  initialParentId = null,
  initialImages = [],
  categories,
  recentPosts,
  redirectTo,
}: {
  mode: "create" | "edit";
  postId?: string;
  initialDescription?: string;
  initialCategory?: string;
  initialParentId?: string | null;
  initialImages?: ExistingImage[];
  categories: PostCategory[];
  recentPosts: RecentPost[];
  redirectTo: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [parentId, setParentId] = useState<string>(initialParentId ?? "");
  const [existing, setExisting] = useState<ExistingImage[]>(initialImages);
  const [removed, setRemoved] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const additions = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...additions]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNew(id: string) {
    setNewImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  function removeExisting(key: string) {
    setExisting((prev) => {
      const target = prev.find((i) => i.key === key);
      if (target) setRemoved((r) => [...r, target]);
      return prev.filter((i) => i.key !== key);
    });
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
      if (!user) throw new Error("You must be signed in.");

      // Upload any newly added images first (compressed client-side).
      const uploadedUrls: string[] = [];
      for (const img of newImages) {
        uploadedUrls.push(await uploadImage(supabase, img.file, "posts"));
      }

      const parentValue = parentId || null;

      if (mode === "create") {
        const { data: inserted, error: insertError } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            description: description.trim(),
            category,
            parent_post_id: parentValue,
            image_url: null,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;

        if (uploadedUrls.length > 0) {
          const rows = uploadedUrls.map((url, i) => ({
            post_id: inserted.id,
            image_url: url,
            position: i,
          }));
          const { error: imgError } = await supabase
            .from("post_images")
            .insert(rows);
          if (imgError) throw imgError;
        }
      } else {
        if (!postId) throw new Error("Missing post id.");

        // If the legacy single image was removed, clear posts.image_url.
        const legacyRemoved = removed.some((r) => r.isLegacy);
        const updatePayload: Record<string, unknown> = {
          description: description.trim(),
          category,
          parent_post_id: parentValue,
        };
        if (legacyRemoved) updatePayload.image_url = null;

        const { error: updateError } = await supabase
          .from("posts")
          .update(updatePayload)
          .eq("id", postId);
        if (updateError) throw updateError;

        // Delete removed post_images rows (non-legacy).
        const removedRowKeys = removed
          .filter((r) => !r.isLegacy)
          .map((r) => r.key);
        if (removedRowKeys.length > 0) {
          await supabase.from("post_images").delete().in("id", removedRowKeys);
        }

        // Best-effort storage cleanup for every removed image.
        for (const r of removed) {
          await deleteImageByUrl(supabase, r.url);
        }

        // Append newly uploaded images after the existing ones.
        if (uploadedUrls.length > 0) {
          const startPos = existing.length;
          const rows = uploadedUrls.map((url, i) => ({
            post_id: postId,
            image_url: url,
            position: startPos + i,
          }));
          const { error: imgError } = await supabase
            .from("post_images")
            .insert(rows);
          if (imgError) throw imgError;
        }
      }

      newImages.forEach((i) => URL.revokeObjectURL(i.preview));
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const linkOptions = recentPosts.filter((p) => p.id !== postId);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you work on? (e.g. Replaced irrigation valve at site 142)"
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />

      {/* Category selector */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Section
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={
                category === c.slug
                  ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Link to a previous post (job continuation) */}
      {linkOptions.length > 0 && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Continues a previous job (optional)
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">— Not a continuation —</option>
            {linkOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.description.length > 70
                  ? p.description.slice(0, 70) + "…"
                  : p.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Image thumbnails (existing + new) */}
      {(existing.length > 0 || newImages.length > 0) && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existing.map((img) => (
            <Thumb key={img.key} src={img.url} onRemove={() => removeExisting(img.key)} />
          ))}
          {newImages.map((img) => (
            <Thumb key={img.id} src={img.preview} onRemove={() => removeNew(img.id)} badge="new" />
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-hover">
          <CameraIcon />
          Add photos
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Post"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Thumb({
  src,
  onRemove,
  badge,
}: {
  src: string;
  onRemove: () => void;
  badge?: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Post photo" className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
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
